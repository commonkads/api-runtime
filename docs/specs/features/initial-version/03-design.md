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
| `src/index.ts` | Log messages: `api-runtime`; `@robproper/strata-*` → `@commonkads/provider-*`; `STRATA_` → `COMMONKADS_` |
| `src/server.ts` | `@robproper/strata-engine` → `@commonkads/engine`; `STRATA_` → `COMMONKADS_` |
| `src/server.test.ts` | `@robproper/strata-engine` → `@commonkads/engine` |
| `README.md` | Title, image/container tags renamed; all `@robproper/strata-*` → `@commonkads/*`; `STRATA_` → `COMMONKADS_`; disclaimer added |
| `Dockerfile` | `@robproper/strata-*` provider installs → `@commonkads/provider-*` |
