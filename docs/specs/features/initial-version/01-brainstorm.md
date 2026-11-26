# Brainstorm — initial-version

## Context

The runtime API was developed inside `strata/runtime-api` and needs to be migrated to the `commonkads` GitHub organisation as a standalone repository with the name `api-runtime`.

## Angles explored

**1. Direct copy with renames and document cleanup**
Copy the source as-is, rename the package, remove internal references to the old strata namespace in documents (not in code — the engine package reference in imports is a functional dependency).

**2. Restructure + rename**
Rename and also refactor the server design — split route handlers, introduce a domain service layer, etc.

**3. Incremental migration**
Port file by file over multiple PRs.

## Direction chosen

**Angle 1.** The source is well-structured and production-ready. A direct copy with targeted renames and document cleanup is the right scope. Structural improvements belong in a follow-on feature.

The key distinction: "do not reference strata-engine in the documents" applies to documentation (README.md, comments) only — the `@robproper/strata-engine` import in `src/server.ts` is a functional dependency and must remain.
