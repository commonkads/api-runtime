# api-runtime

> **Disclaimer:** This project is an independent open-source software implementation inspired by the CommonKADS knowledge engineering methodology (Schreiber et al.). It is not affiliated with or endorsed by the original methodology authors or any third-party trademark holders.

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
  -e COMMONKADS_PROVIDER=bedrock \
  -e COMMONKADS_MODEL=anthropic.claude-3-5-sonnet-20241022-v2:0 \
  -e COMMONKADS_PROVIDER_PACKAGES=@commonkads/provider-aws \
  -e COMMONKADS_S3_BUCKET=my-knowledge-bucket \
  -e AWS_REGION=us-east-1 \
  api-runtime
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port to listen on |
| `COMMONKADS_PROVIDER_PACKAGES` | _(none)_ | Comma-separated package names to register at startup, e.g. `@commonkads/provider-aws,@commonkads/provider-anthropic` |
| `COMMONKADS_PROVIDER` | `bedrock` | Provider type: `bedrock`, `claude`, `gemini`, `ollama` |
| `COMMONKADS_MODEL` | _(required)_ | Model name passed to the provider |
| `COMMONKADS_KNOWLEDGE_ROOT` | `/knowledge` | Path to knowledge directory (local/Ollama deployments) |
| `COMMONKADS_S3_BUCKET` | _(none)_ | S3 bucket name; presence switches file store to S3 |
| `AWS_REGION` | _(none)_ | AWS region for Bedrock and S3 |
| `ANTHROPIC_API_KEY` | _(none)_ | Anthropic API key |
| `ANTHROPIC_AUTH_TOKEN` | _(none)_ | Anthropic auth token (alternative to API key) |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY` | _(none)_ | Google AI API key |
| `OLLAMA_BASE_URL` | _(none)_ | Ollama base URL, e.g. `http://host.docker.internal:11434` |
| `COMMONKADS_THINKING` | `false` | Set to `true` to enable extended thinking (Claude / Gemini) |
| `COMMONKADS_GUARDRAIL` | _(none)_ | Bedrock guardrail name |
| `COMMONKADS_LOG_LEVEL` | _(none)_ | Log level filter for PSM step execution logs |

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
