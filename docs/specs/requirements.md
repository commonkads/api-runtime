# Requirements — api-runtime

## Purpose

`api-runtime` is a Docker-deployable REST API for executing CommonKADS PSM (Problem-Solving Method) tasks. It accepts a knowledge catalog and domain configuration, then exposes HTTP endpoints for health-checking and running PSM tasks against configured knowledge domains.

## Functional Requirements

### Endpoints

| Method | Path | Behaviour |
|--------|------|-----------|
| GET | `/health` | Returns `{"status":"ok"}` with HTTP 200 |
| GET | `/ready` | Returns `{"status":"ready","domains":N}` or HTTP 503 if the catalog is missing or empty |
| GET | `/domains` | Returns `{"domains":[{"id":"...","name":"..."},...]}` |
| POST | `/execute` | Executes a PSM task; returns `{"result":{...}}` with optional `context` |

### POST /execute

1. Requires `domain` (string) and `input` (any object) in the request body; returns HTTP 400 `BAD_REQUEST` if either is missing.
2. Returns HTTP 400 `UNKNOWN_DOMAIN` if the domain id is not in the catalog.
3. Supports optional `options.explain`, `options.audit`, and `options.timings` flags; populates the `context` response field when enabled.
4. Returns HTTP 500 with structured error codes (`EXECUTION_ERROR`, `CONFIGURATION_ERROR`, `INPUT_VALIDATION_ERROR`, `INTERNAL_ERROR`) on failure.

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `COMMONKADS_PROVIDER_PACKAGES` | _(none)_ | Comma-separated provider packages to register at startup |
| `COMMONKADS_PROVIDER` | `bedrock` | Provider type |
| `COMMONKADS_MODEL` | _(required)_ | Model name |
| `COMMONKADS_KNOWLEDGE_ROOT` | `/knowledge` | Local knowledge directory |
| `COMMONKADS_S3_BUCKET` | _(none)_ | S3 bucket; switches file store to S3 when set |
| `AWS_REGION` | _(none)_ | AWS region |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_AUTH_TOKEN` | _(none)_ | Anthropic credentials |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY` | _(none)_ | Google AI credentials |
| `OLLAMA_BASE_URL` | _(none)_ | Ollama base URL |
| `COMMONKADS_THINKING` | `false` | Enable extended thinking |
| `COMMONKADS_GUARDRAIL` | _(none)_ | Bedrock guardrail name |
| `COMMONKADS_LOG_LEVEL` | _(none)_ | Log level filter |

### Container

1. The image is built with an optional `PROVIDERS` build argument (`local`, `aws`, `anthropic`, `google`).
2. The image exposes port 3000.

## Non-functional Requirements

- Node.js ≥ 24 required.
- TypeScript with strict mode and ESM module output.
- Lint and format enforced via ESLint + Prettier on every compile.
- Tests run with the Node built-in test runner via `tsx`; use fake file store and inference provider.
