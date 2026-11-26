# Progress — initial-version

## 2026-11-26

- Decision: `src/server.ts` copied verbatim — the `@robproper/strata-engine` import is a functional dependency; the "do not reference strata-engine in the documents" requirement applies to documentation only.
- Decision: `STRATA_*` environment variable names preserved — they are part of the public deployment API; renaming would break existing deployments without a migration path.
- Decision: README rewritten from scratch from the strata source rather than minimally patched — the original README had `strata-runtime-api` throughout; a full rewrite was cleaner than individual replacements.
