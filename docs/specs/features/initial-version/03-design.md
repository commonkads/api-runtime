# Design — initial-version

## New files

| File | Source |
|------|--------|
| `src/index.ts` | Copied from `strata/runtime-api/src/index.ts` |
| `src/server.ts` | Copied from `strata/runtime-api/src/server.ts` |
| `src/server.test.ts` | Copied from `strata/runtime-api/src/server.test.ts` |
| `Dockerfile` | Copied from `strata/runtime-api/Dockerfile` |
| `package.json` | Adapted from `strata/runtime-api/package.json` |
| `tsconfig.json` | Copied verbatim |
| `tsconfig.test.json` | Copied verbatim |
| `eslint.config.mjs` | Copied verbatim |
| `.prettierrc.js` | Copied verbatim |
| `.gitignore` | Copied verbatim |
| `README.md` | Adapted from `strata/runtime-api/README.md` |
| `docs/specs/requirements.md` | New |
| `docs/specs/design.md` | New |

## Changes from source

| File | Change |
|------|--------|
| `package.json` | `name`: `strata-runtime-api` → `api-runtime`; `description`: "REST API for the Strata engine" → "REST API for PSM task execution" |
| `src/index.ts` | Log messages: `strata-runtime-api` → `api-runtime` |
| `README.md` | Title, image tags, container names: `strata-runtime-api` → `api-runtime`; "built into `@robproper/strata-engine`" reworded to "always available"; disclaimer added |

## Key decisions

- `src/server.ts` left completely unchanged — the `@robproper/strata-engine` import is a functional dependency, not a document reference.
- Environment variable names (`STRATA_*`) preserved — they are part of the public API and renaming them would break deployments.
