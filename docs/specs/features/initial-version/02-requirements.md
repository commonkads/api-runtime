# Requirements — initial-version

## In scope

- Copy source from `strata/runtime-api` into `commonkads/api-runtime`
- Rename `package.json` `name` from `strata-runtime-api` to `api-runtime`; update description
- Replace all `@robproper/strata-engine` and `@robproper/strata-*` package references with `@commonkads/engine` and `@commonkads/provider-*`
- Rename all `STRATA_` environment variables to `COMMONKADS_` in source code and documentation
- Update log messages in `src/index.ts` to reference `api-runtime`
- Update `README.md`: rename image/container tags; update all package and env var references; add methodology disclaimer
- Initialise git repository, add remote `git@github-commonkads:commonkads/api-runtime.git`
- Push initial feature branch `feature/initialise-api-runtime`

## Out of scope

- Adding `@commonkads/dev-workflow` as a devDependency
- CI workflow setup
