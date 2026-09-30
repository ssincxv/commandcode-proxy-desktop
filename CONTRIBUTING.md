# Contributing

Use Node.js 22.12+ on Windows. Run `npm ci`, `npm test`, `npm run test:desktop`, and `npm run test:ui`. UI tests use fixture model responses unless `--live` is explicitly requested with `CC_SMOKE_API_KEY`.

Keep desktop changes in `desktop/`; isolate protocol changes in `proxy.mjs` with regression tests. Do not commit credentials, local config, generated QA screenshots, dependencies, or installers. Preserve all upstream and dependency license notices. The contributor submits code under the repository MIT license.

For a release, update package/lockfile versions together, run checks, build with `npm run dist:win`, then run `node desktop/smoke.mjs --packaged`. Attach installers and SHA-256 checksums to a GitHub Release instead of committing binaries.
