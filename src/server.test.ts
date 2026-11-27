import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import type {
  FileContent,
  IStorageBackend,
  InferenceProvider,
  InferenceOptions,
} from '@commonkads/engine';

import { createServer } from './server.js';

const CATALOG_YML = `domains:
  - id: test-domain
    name: Test Domain
    path: test-domain/`;

const MANIFEST_YML = `name: Test Domain
task: assessment
psm: assessment-with-abstraction
knowledge:
  ontologyPath: ontology.yml
  normsPath: norms.yml
  abstractionPath: abstraction.yml
  evaluationPath: evaluation.yml`;

class FakeFileStore implements IStorageBackend {
  constructor(private readonly files: Record<string, string> = {}) {}
  async read(path: string): Promise<string> {
    const content = this.files[path];
    if (content === undefined) throw new Error(`no such fake file: ${path}`);
    return content;
  }
  async readWithVersion(path: string): Promise<FileContent> {
    return { content: await this.read(path), version: 'v1' };
  }
  async list(prefix: string = ''): Promise<string[]> {
    return Object.keys(this.files)
      .filter((p) => p.startsWith(prefix))
      .sort();
  }
}

class FakeInference implements InferenceProvider {
  private callCount = 0;
  async infer(_prompt: string, _options?: InferenceOptions): Promise<string> {
    this.callCount++;
    // Assessment PSM: odd calls are 'abstract' (needs object), even are 'evaluate' (needs array)
    return this.callCount % 2 === 1 ? JSON.stringify({ derivedValue: 1 }) : JSON.stringify([]);
  }
}

function withCatalog(extra: Record<string, string> = {}): FakeFileStore {
  return new FakeFileStore({
    'catalog.yml': CATALOG_YML,
    'test-domain/domain.yml': MANIFEST_YML,
    'test-domain/ontology.yml': 'ontology',
    'test-domain/norms.yml': 'norms',
    'test-domain/abstraction.yml': 'abstraction',
    'test-domain/evaluation.yml': 'evaluation',
    ...extra,
  });
}

describe('GET /health', () => {
  it('returns 200 ok', async () => {
    const app = createServer({ fileStore: new FakeFileStore(), inference: new FakeInference() });
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body, { status: 'ok' });
  });
});

describe('GET /ready', () => {
  it('returns 200 when catalog exists and has domains', async () => {
    const app = createServer({ fileStore: withCatalog(), inference: new FakeInference() });
    const res = await request(app).get('/ready');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ready');
    assert.strictEqual(res.body.domains, 1);
  });

  it('returns 503 when catalog is missing', async () => {
    const app = createServer({ fileStore: new FakeFileStore(), inference: new FakeInference() });
    const res = await request(app).get('/ready');
    assert.strictEqual(res.status, 503);
  });

  it('returns 503 when catalog has no domains', async () => {
    const app = createServer({
      fileStore: new FakeFileStore({ 'catalog.yml': 'domains: []' }),
      inference: new FakeInference(),
    });
    const res = await request(app).get('/ready');
    assert.strictEqual(res.status, 503);
    assert.strictEqual(res.body.reason, 'No domains in catalog');
  });
});

describe('GET /domains', () => {
  it('returns domain list without paths', async () => {
    const app = createServer({ fileStore: withCatalog(), inference: new FakeInference() });
    const res = await request(app).get('/domains');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.domains, [{ id: 'test-domain', name: 'Test Domain' }]);
  });
});

describe('POST /execute', () => {
  it('returns 400 when input is missing', async () => {
    const app = createServer({ fileStore: withCatalog(), inference: new FakeInference() });
    const res = await request(app).post('/execute').send({ domain: 'test-domain' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, 'BAD_REQUEST');
  });

  it('returns 400 when domain is not in catalog', async () => {
    const app = createServer({ fileStore: withCatalog(), inference: new FakeInference() });
    const res = await request(app).post('/execute').send({ domain: 'unknown', input: {} });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, 'UNKNOWN_DOMAIN');
  });

  it('executes the domain and returns a result', async () => {
    const app = createServer({ fileStore: withCatalog(), inference: new FakeInference() });
    const res = await request(app)
      .post('/execute')
      .send({ domain: 'test-domain', input: { x: 1 } });
    assert.strictEqual(res.status, 200);
    assert.ok('result' in res.body);
  });

  it('includes context fields when options are set', async () => {
    const app = createServer({ fileStore: withCatalog(), inference: new FakeInference() });
    const res = await request(app)
      .post('/execute')
      .send({ domain: 'test-domain', input: { x: 1 }, options: { audit: true, timings: true } });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.context?.auditLog));
    assert.ok(Array.isArray(res.body.context?.timings));
  });
});
