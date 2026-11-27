# Changelog

## Table of Contents

- [0.2.0 — 2026-11-27](#020--2026-11-27)
- [0.1.0 — 2026-11-26](#010--2026-11-26)

---

## [0.2.0] — 2026-11-27

- Updated `@commonkads/engine` to `^0.4.0`
- Renamed `IFileStore` → `IStorageBackend`, `IInferenceProvider` → `InferenceProvider` throughout
- Replaced `FileStoreKnowledgeAdapter` with an inline `ICatalog` shim; `RuntimeEngine` now takes only the inference provider

[Full change log →](docs/specs/features/update-engine/07-changes.md)

---

## [0.1.0] — 2026-11-26

- Initial REST API with `/health`, `/ready`, `/domains`, and `/execute` endpoints
- Multi-stage Docker build with optional provider installs (`aws`, `anthropic`, `google`)
- Full PSM task execution via `@commonkads/engine`

[Full change log →](docs/specs/features/initial-version/07-changes.md)
