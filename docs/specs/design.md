# Design — api-runtime

## Package Layout

```
api-runtime/
  src/
    index.ts        # Entry point — provider registration, file store selection, server start
    server.ts       # Express app factory (createServer); all route handlers
    server.test.ts  # HTTP tests via supertest with FakeFileStore and FakeInference
  Dockerfile        # Multi-stage build with optional PROVIDERS build arg
  package.json
  tsconfig.json
  tsconfig.test.json
  eslint.config.mjs
  .prettierrc.js
```

## Architecture

### Entry point (`src/index.ts`)

Performs three startup tasks before binding the port:

1. **File store** — `buildFileStore()` checks `STRATA_S3_BUCKET`; if set, dynamically imports `@robproper/strata-aws` and instantiates `S3FileStore`; otherwise uses `LocalFileStore`.
2. **Provider registration** — `loadProviders()` iterates `STRATA_PROVIDER_PACKAGES`, dynamically imports each, and calls `.register()`. Failed imports log a warning and are skipped.
3. **Server start** — calls `createServer({ fileStore })` and binds `PORT`.

### Server (`src/server.ts`)

`createServer(deps)` accepts optional `fileStore` and `inference` overrides (used by tests). At startup it builds the inference provider from env vars (`buildProviderOptions`) and constructs a `RuntimeEngine`.

Each request to `/execute`:
1. Loads the catalog from the file store.
2. Looks up the domain entry by id.
3. Loads the domain manifest and task.
4. Constructs a `RuntimeContext` with the requested options.
5. Builds a domain-scoped file store (prefix-wraps catalog store with the domain path).
6. Executes via `RuntimeEngine.execute(task, input, context)`.
7. Assembles and returns the response with optional `context` fields.

### Domain file store scoping

`buildDomainFileStore(catalogStore, domainPath)` wraps the catalog-level file store so the domain's knowledge files are addressed relative to their domain directory. This prevents one domain from reading another domain's files.

### Docker build

The `Dockerfile` uses a build arg `PROVIDERS` (default `local`). The build stage installs the base package, then conditionally installs provider packages (`@robproper/strata-aws`, `@robproper/strata-anthropic`, `@robproper/strata-google`) based on the comma-separated `PROVIDERS` value. The final stage copies only `dist/`, `node_modules/`, and `package.json`.
