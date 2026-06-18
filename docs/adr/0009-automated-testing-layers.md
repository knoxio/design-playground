# 0009 — Automated testing layers

**Status:** Accepted

## Context

The handoff transfers a working system to engineers, and the running model
depends on Mary driving Claude over a contract she cannot read in code. The
most dangerous regression is a contract or skill change that silently
produces a broken client folder — discovered only when the app white-screens
for Mary, with no engineer in the loop. The most security-relevant code is
the feedback Worker, which gates reads and writes by Access identity. Both
need behavioral assertions, not just "it compiles."

## Decision

Automated testing in layers, each at its own cost and runner:

- **Registry & contract** (Vitest, Node): `discover.ts` and the Zod schemas
  are pure functions over string/module inputs. Fixture folders — good and
  deliberately broken — assert the typed entries and the exact `errors[]`.
  The `errors[]` array is the client-folder contract written as code.
- **Pure shell helpers** (Vitest): theme resolution precedence, viewport
  math, comment-anchor selector building and the chrome exclusion.
- **Render smoke** (Vitest + jsdom / browser mode): every discovered page
  and every kit demo renders without throwing under a theme.
- **End-to-end** (Playwright): the real user path — boot, nav, dock tools,
  theme repaint, comment overlay, and the scoped client preview.
- **Worker API** (`@cloudflare/vitest-pool-workers` against ephemeral D1):
  each identity class, the 403 paths, client isolation, the status state
  machine.

The `pnpm run ci` gate runs lint, format check, boundaries, typecheck,
`test` (Vitest), `test:functions` (Worker), build, and the scoped-build leak
check. E2E runs separately (ADR-0015).

## Consequences

- The contract is locked before ownership transfers; a skill that produces a
  contract-violating folder fails a test rather than reaching Mary.
- Worker auth correctness is asserted, not assumed.
- Unit and Worker tests live inside the gate, so green-locally stays
  green-on-CI (ADR-0015). The play-test feature (page-authored interaction
  checks) extends this model and is designed but not yet built.
