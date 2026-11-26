# api-runtime

A Docker-deployable REST API for PSM task execution. It accepts a knowledge catalog and
domain configuration, then exposes HTTP endpoints for health-checking and executing
PSM (Problem-Solving Method) tasks against configured knowledge domains.

## Building the image

```sh
# Local only — Ollama + LocalFileStore, no cloud SDKs (default)
docker build -t api-runtime .

# AWS Bedrock + S3
docker build --build-arg PROVIDERS=aws -t api-runtime .

# Anthropic Claude
docker build --build-arg PROVIDERS=anthropic -t api-runtime .

# AWS + Anthropic
docker build --build-arg PROVIDERS=aws,anthropic -t api-runtime .

# All providers
docker build --build-arg PROVIDERS=aws,anthropic,google -t api-runtime .
```

Supported `PROVIDERS` values (comma-separated): `local`, `aws`, `anthropic`, `google`.
`local` is a no-op — Ollama and LocalFileStore are always available.

## Running the container

```sh
docker run -p 3000:3000 \
  -e STRATA_PROVIDER=bedrock \
  -e STRATA_MODEL=anthropic.claude-3-5-sonnet-20241022-v2:0 \
  -e STRATA_PROVIDER_PACKAGES=@robproper/strata-aws \
  -e STRATA_S3_BUCKET=my-knowledge-bucket \
  -e AWS_REGION=us-east-1 \
  api-runtime
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port to listen on |
| `STRATA_PROVIDER_PACKAGES` | _(none)_ | Comma-separated package names to register at startup, e.g. `@robproper/strata-aws,@robproper/strata-anthropic` |
| `STRATA_PROVIDER` | `bedrock` | Provider type: `bedrock`, `claude`, `gemini`, `ollama` |
| `STRATA_MODEL` | _(required)_ | Model name passed to the provider |
| `STRATA_KNOWLEDGE_ROOT` | `/knowledge` | Path to knowledge directory (local/Ollama deployments) |
| `STRATA_S3_BUCKET` | _(none)_ | S3 bucket name; presence switches file store to S3 |
| `AWS_REGION` | _(none)_ | AWS region for Bedrock and S3 |
| `ANTHROPIC_API_KEY` | _(none)_ | Anthropic API key |
| `ANTHROPIC_AUTH_TOKEN` | _(none)_ | Anthropic auth token (alternative to API key) |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY` | _(none)_ | Google AI API key |
| `OLLAMA_BASE_URL` | _(none)_ | Ollama base URL, e.g. `http://host.docker.internal:11434` |
| `STRATA_THINKING` | `false` | Set to `true` to enable extended thinking (Claude / Gemini) |
| `STRATA_GUARDRAIL` | _(none)_ | Bedrock guardrail name |
| `STRATA_LOG_LEVEL` | _(none)_ | Log level filter for PSM step execution logs |

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check — returns `{"status":"ok"}` |
| GET | `/ready` | Readiness check — returns `{"status":"ready","domains":N}` or 503 |
| GET | `/domains` | Lists available domains from the catalog |
| POST | `/execute` | Executes a PSM task |

## POST /execute

**Request:**
```json
{
  "domain": "domain-id",
  "input": { },
  "options": {
    "explain": false,
    "audit": false,
    "timings": false
  }
}
```

**Response:**
```json
{
  "result": { },
  "context": {
    "auditLog": [],
    "timings": {},
    "explanations": {}
  }
}
```

`context` is omitted when no options are enabled. Each `context` key is omitted when its
corresponding option is `false`.

**Error responses:**

| Status | Code | Meaning |
|--------|------|---------|
| 400 | `BAD_REQUEST` | Missing `domain` or `input` |
| 400 | `UNKNOWN_DOMAIN` | Domain not found in catalog |
| 500 | `EXECUTION_ERROR` | PSM task failed; `step` names the failing step |
| 500 | `CONFIGURATION_ERROR` | Catalog or manifest misconfiguration |
| 500 | `INTERNAL_ERROR` | Unexpected error |
