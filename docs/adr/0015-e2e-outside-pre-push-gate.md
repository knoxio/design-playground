# 0015 — E2E outside the pre-push gate

**Status:** Accepted

## Context

The `pnpm run ci` gate is replayed by the husky pre-push hook in a clean
worktree with a frozen-lockfile install, so green-locally means green-on-CI
and a pushed PR never needs a fix-up cycle. Browser end-to-end tests need a
Chromium install and a running dev server. Putting them in that gate makes
every push — including a designer's `clients/**`-only change — pay for a
browser the change does not exercise. Page rendering for client work is
already covered by the render-smoke unit test.

## Decision

E2E runs as a **path-filtered CI job** (`.github/workflows/e2e.yml`),
triggered only when `app/`, `packages/`, the suite, or the build config
changes. It is **not** in the `pnpm run ci` replay that pre-push runs, so the
local gate stays browser-free and fast.

Unit tests and the Worker API tests (ADR-0009) **are** in the gate
(`test`, `test:functions`), because they are fast and need no browser.

## Consequences

- A `clients/**`-only PR stays fast and browser-free; its pages are still
  covered by render-smoke in the always-run gate.
- App/kit changes — the ones that can break the real user path — trigger
  E2E.
- The pre-push promise still holds for everything it covers: if pre-push
  passes, the gate passes on CI. E2E is a separate signal layered on top, not
  part of that promise.
