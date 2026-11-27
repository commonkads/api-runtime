# Changes — update-engine

## 0.2.0 — 2026-11-27

- Updated `@commonkads/engine` dependency from `*` to `^0.4.0`
- Renamed `IFileStore` → `IStorageBackend`, `IInferenceProvider` → `InferenceProvider` throughout
- Replaced `FileStoreKnowledgeAdapter` + two-arg `RuntimeEngine` constructor with an inline `ICatalog` shim passed via `RuntimeContext.catalog`; `RuntimeEngine` now takes only the inference provider
