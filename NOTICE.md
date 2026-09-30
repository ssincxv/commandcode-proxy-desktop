# Attribution / 来源与授权

This project is an unofficial Windows desktop companion derived from
[MAXeaglet/commandcode-proxy](https://github.com/MAXeaglet/commandcode-proxy).
It is not an official CommandCodeAI product and is not endorsed by MAXeaglet or CommandCodeAI.

## Upstream

- Author: MAXeaglet and upstream contributors.
- License: MIT. The upstream copyright, permission notice and warranty disclaimer are retained in `LICENSE`.
- Baseline: `cce214d1db9d15c36ea1b59c1b0fb996834d323a` (master, 2026-09-18).
- Upstream Git history and original documentation in `docs/upstream/` are retained.
- Protocol implementation: `proxy.mjs`; the desktop addition makes protocol-drift warnings suppressible with `CC_SUPPRESS_VERSION_DRIFT_WARNING`. Suppression does not establish compatibility with newer upstream protocols.

## Desktop additions

Copyright (c) 2026 ssincxv. MIT.

The `desktop/` UI, process management, configuration, installer customization, model selection and speed tests, and desktop build/test integration are maintained here. Report desktop issues here; report protocol issues upstream with an independent reproduction when possible.

## Assets and dependencies

Artwork provenance: `desktop/assets/ICON-SOURCE.md`.
CommandCodeAI, OpenCode, Electron, Apple and Discord names/trademarks are not licensed by this project's MIT license. This project does not claim ownership or affiliation.

Electron, Chromium, Node.js and other dependencies remain under their own licenses. Packaged distributions retain Electron's `LICENSE.electron.txt` and `LICENSES.chromium.html`; the bundled proxy and desktop license notices are included in application resources. Do not remove these notices when redistributing the installer or unpacked application.
