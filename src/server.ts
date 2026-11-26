import express from 'express';
import type { Express } from 'express';

import {
  LocalFileStore,
  FileStoreKnowledgeAdapter,
  RuntimeEngine,
  RuntimeContext,
  loadCatalog,
  loadDomainManifestFromStore,
  loadTaskFromManifest,
  buildInference,
  type ProviderConfig,
  StreamLogger,
  LevelFilterLogger,
  type LogLevel,
  KnowledgeCatalogError,
  DomainManifestError,
  TaskExecutionError,
  TaskInputValidationError,
} from '@commonkads/engine';
import type { IFileStore, IInferenceProvider } from '@commonkads/engine';

function buildProviderOptions(): ProviderConfig {
  const type = process.env['STRATA_PROVIDER'] ?? 'bedrock';
  const model = process.env['STRATA_MODEL'] ?? '';
  switch (type) {
    case 'claude':
      return {
        type: 'claude',
        model,
        apiKey: process.env['ANTHROPIC_API_KEY'],
        authToken: process.env['ANTHROPIC_AUTH_TOKEN'],
        thinking: process.env['STRATA_THINKING'] === 'true',
      };
    case 'gemini':
      return {
        type: 'gemini',
        model,
        apiKey: process.env['GEMINI_API_KEY'] ?? process.env['GOOGLE_API_KEY'],
        thinking: process.env['STRATA_THINKING'] === 'true',
      };
    case 'ollama':
      return { type: 'ollama', model, baseUrl: process.env['OLLAMA_BASE_URL'] };
    default:
      return {
        type: 'bedrock',
        model,
        region: process.env['AWS_REGION'],
        guardrail: process.env['STRATA_GUARDRAIL'],
      };
  }
}

export interface ServerDeps {
  fileStore?: IFileStore;
  inference?: IInferenceProvider;
}

// domainPath comes from catalog.yml, which is operator-controlled, not from request input.
function buildDomainFileStore(catalogStore: IFileStore, domainPath: string): IFileStore {
  const prefix = domainPath.endsWith('/') ? domainPath : `${domainPath}/`;
  return {
    read: (path) => catalogStore.read(`${prefix}${path}`),
    readWithVersion: (path) => catalogStore.readWithVersion(`${prefix}${path}`),
    list: async (subPrefix = '') =>
      (await catalogStore.list(`${prefix}${subPrefix}`)).map((p) => p.slice(prefix.length)),
  };
}

export function createServer(deps: ServerDeps = {}): Express {
  const fileStore =
    deps.fileStore ?? new LocalFileStore(process.env['STRATA_KNOWLEDGE_ROOT'] ?? '/knowledge');
  const inference = deps.inference ?? buildInference(buildProviderOptions());
  const logLevel = process.env['STRATA_LOG_LEVEL'] as LogLevel | undefined;

  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/ready', async (_req, res) => {
    try {
      const catalog = await loadCatalog(fileStore);
      if (catalog.domains.length === 0) {
        res.status(503).json({ status: 'unavailable', reason: 'No domains in catalog' });
        return;
      }
      res.json({ status: 'ready', domains: catalog.domains.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(503).json({ status: 'unavailable', reason: msg });
    }
  });

  app.get('/domains', async (_req, res) => {
    try {
      const catalog = await loadCatalog(fileStore);
      res.json({ domains: catalog.domains.map((d) => ({ id: d.id, name: d.name })) });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(503).json({ error: { code: 'CATALOG_ERROR', message: msg } });
    }
  });

  app.post('/execute', async (req, res) => {
    const body = req.body as {
      domain?: string;
      input?: unknown;
      options?: { explain?: boolean; audit?: boolean; timings?: boolean };
    };

    const { domain, input, options = {} } = body;

    if (typeof domain !== 'string' || input === undefined) {
      res
        .status(400)
        .json({ error: { code: 'BAD_REQUEST', message: '"domain" and "input" are required' } });
      return;
    }

    try {
      const catalog = await loadCatalog(fileStore);
      const entry = catalog.domains.find((d) => d.id === domain);

      if (!entry) {
        res.status(400).json({
          error: { code: 'UNKNOWN_DOMAIN', message: `Domain "${domain}" not found in catalog` },
        });
        return;
      }

      const manifest = await loadDomainManifestFromStore(fileStore, entry.path);
      const task = loadTaskFromManifest(manifest);

      const logger = logLevel ? new LevelFilterLogger(new StreamLogger(), logLevel) : undefined;

      const context = new RuntimeContext({
        logger,
        explain: Boolean(options.explain),
        enableAuditLog: Boolean(options.audit),
        enableTimings: Boolean(options.timings),
      });

      const domainFileStore = buildDomainFileStore(fileStore, entry.path);
      const domainEngine = new RuntimeEngine(new FileStoreKnowledgeAdapter(domainFileStore), inference);
      const result = await domainEngine.execute(task, input, context);

      const responseContext: Record<string, unknown> = {};
      if (options.audit && context.auditLog) {
        responseContext['auditLog'] = context.auditLog;
      }
      if (options.timings && context.timings) {
        responseContext['timings'] = context.timings;
      }
      if (options.explain && Object.keys(context.explanations).length > 0) {
        responseContext['explanations'] = context.explanations;
      }

      res.json({
        result,
        ...(Object.keys(responseContext).length > 0 && { context: responseContext }),
      });
    } catch (err) {
      if (err instanceof TaskInputValidationError) {
        res.status(400).json({
          error: {
            code: 'INPUT_VALIDATION_ERROR',
            message: err.message,
            errors: err.errors,
          },
        });
        return;
      }
      if (err instanceof TaskExecutionError) {
        res
          .status(500)
          .json({ error: { code: 'EXECUTION_ERROR', message: err.message, step: err.step } });
        return;
      }
      if (err instanceof DomainManifestError || err instanceof KnowledgeCatalogError) {
        res.status(500).json({
          error: { code: 'CONFIGURATION_ERROR', message: (err as Error).message },
        });
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: msg } });
    }
  });

  return app;
}
