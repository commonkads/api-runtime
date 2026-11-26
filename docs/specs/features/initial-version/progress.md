# Progress — initial-version

## 2026-11-26

- Decision: all `@robproper/strata-*` package references replaced with `@commonkads/engine` and `@commonkads/provider-*` throughout source, Dockerfile, and docs.
- Decision: all `STRATA_` environment variable prefixes replaced with `COMMONKADS_` throughout source and docs — the services are brand new with no existing deployments to break.
- Decision: README rewritten from scratch from the strata source rather than minimally patched — the original README had `strata-runtime-api` throughout; a full rewrite was cleaner than individual replacements.
