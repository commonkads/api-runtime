# Requirements — initial-version

## In scope

- Copy source from `strata/runtime-api` into `commonkads/api-runtime`
- Rename `package.json` `name` from `strata-runtime-api` to `api-runtime`
- Update `package.json` `description` to remove "Strata engine" reference
- Update log messages in `src/index.ts` to reference `api-runtime`
- Update `README.md`: rename image/container tags from `strata-runtime-api` to `api-runtime`; remove explicit `@robproper/strata-engine` package name from documentation text
- Add methodology disclaimer to `README.md`
- Initialise git repository, add remote `git@github-commonkads:commonkads/api-runtime.git`
- Push initial feature branch `feature/initialise-api-runtime`

## Out of scope

- Renaming `@robproper/strata-engine` import in source code (it is a functional dependency)
- Renaming environment variables (`STRATA_*`) — these are runtime configuration and changing them would break existing deployments
- Adding `@commonkads/dev-workflow` as a devDependency
- CI workflow setup
