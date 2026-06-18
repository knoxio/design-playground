# Testing guide

How the playground is tested and how to add a test. The layer model and its
rationale are in
[ADR 0009 — automated testing layers](../adr/0009-automated-testing-layers.md);
this is the operational how-to.

Three runners, one principle: protect the folder contract first, the app
second, the prototype last.

## Layers

| Layer | Catches                                                   | Runner                            | Where                                |
| ----- | --------------------------------------------------------- | --------------------------------- | ------------------------------------ |
| 1A    | Folder-contract violations (the `errors[]` array)         | Vitest (node)                     | `app/src/registry/*.test.ts`         |
| 1B    | Pure shell logic — theme scope, viewport, comment anchors | Vitest (node)                     | `app/src/shell/**/*.test.ts`         |
| 1C    | Render smoke — every page/kit demo mounts                 | Vitest (jsdom)                    | `app/src/test/render-smoke.test.tsx` |
| 1D    | End-to-end smoke — boot, nav, dock, scoped preview        | Playwright                        | `e2e/*.spec.ts`                      |
| API   | Worker auth, client scoping, status state machine         | `@cloudflare/vitest-pool-workers` | `functions/api/*.test.ts`            |
| 2     | Skill rot + mechanical-skill mechanics                    | Vitest (node) + `lint:skills`     | `scripts/*.test.mjs`, `lint-skills`  |
| 3     | Per-page prototype interaction ("play-test")              | Playwright                        | `e2e/play.spec.ts` + page `play`     |

**Layer 1A** is the highest-value layer: `discover.ts` + `schemas.ts` parse the
filesystem against Zod schemas and emit an `errors[]` array — the client-folder
contract written as code. `discover.test.ts` asserts that array stays empty for
whatever is on disk, so a skill or hand-edit that commits a contract-violating
folder fails CI without coupling to any one client.

**Layer 1C** mounts every discovered page, kit demo, and component demo to
catch broken imports, bad mock-data shapes, and null derefs the moment they
land — "it renders", not "how it looks".

**The API layer** is security-relevant: it asserts each identity class (design
domain / client email / service token / anonymous → 403), per-client
isolation, and the `open → applied/rejected/outdated` status machine, against a
real ephemeral D1 binding via Miniflare.

## Running

| Command               | Runs                                                  |
| --------------------- | ----------------------------------------------------- |
| `pnpm test`           | layer 1A–1C (Vitest, `@design/app`)                   |
| `pnpm test:functions` | the worker API tests (`functions/vitest.config.mts`)  |
| `pnpm test:scripts`   | layer 2 script tests (`scripts/*.test.mjs`)           |
| `pnpm lint:skills`    | layer 2 static skill lint (`scripts/lint-skills.mjs`) |
| `pnpm test:e2e`       | layer 1D + 3 (Playwright; starts dev servers)         |
| `pnpm test:play`      | layer 3 play-tests only (`e2e/play.spec.ts`)          |

`pnpm test:e2e` boots two dev servers via `playwright.config.ts`: the internal
app on `:3003` and a `VITE_CLIENT=marlow` scoped preview on `:3010`, so the
scoped-preview path is tested against a real scoped build.

## The CI gate

`pnpm run ci` (run by both `.github/workflows/ci.yml` on PRs and the `checks`
job in `deploy.yml` on main):

```
lint → lint:skills → format:check → boundaries → typecheck → test
     → test:functions → test:scripts → build → verify:scoped
```

E2E (layer 1D) is **not** in this gate. It runs as a separate, path-filtered
job (`.github/workflows/e2e.yml`) only when `app/**`, `packages/**`, `e2e/**`,
or the Playwright config change — client-only PRs stay fast and browser-free
because page rendering is already covered by the layer-1C render smoke in the
always-run gate. This split is [ADR 0015 — E2E outside the pre-push gate](../adr/0015-e2e-outside-pre-push-gate.md): the husky pre-push hook replays `pnpm run ci`, so keeping Playwright out of it keeps pushes fast while the unit
layers still guarantee a client PR is sound.

## Conventions

From the root `CLAUDE.md` and the agent-sized-module lint:

- **No `as any`, no `as unknown as T`.** Type correctly. The worker
  test-harness shows the pattern — narrow `unknown` with guards, not casts.
- **No `eslint-disable`, `ts-ignore`, or any suppression.** Fix the cause.
- **Module limits** (lint-enforced): complexity ≤ 15, files ≤ 350 lines,
  functions ≤ 200 lines, depth ≤ 4, params ≤ 5. A test file that outgrows a
  limit splits — never raise the limit.
- **No long Playwright timeouts.** Rely on auto-waiting (`toBeVisible`,
  `toHaveURL`, locators). A 15s timeout on a `click` or `select` is a smell and
  a reason to reject the change (root `CLAUDE.md` rule 11). The existing specs
  use no explicit timeouts; keep it that way.
- **Test against what's on disk, not a snapshot of one client.** Layer-1A/1C
  tests enumerate discovered entities so they hold for any client.

## Adding a test

### A unit test (pure logic — layer 1A/1B)

Add `<name>.test.ts` beside the source in `app/src/`. Vitest runs in the node
env (`app/vitest.config.ts`); the aliases mirror `vite.config.ts` so `@design/ui`
and the `clients/` glob resolve identically to the build. For contract rules,
feed fixture inputs to `discoverClients` / `schemas` and assert the exact
`errors[]` entries.

### A render-smoke case (layer 1C)

Nothing to author — `render-smoke.test.tsx` enumerates every discovered page,
variant page, kit demo, and component demo automatically. A new page or kit
component with a `demo` is covered the moment it is added. The file is jsdom
(`// @vitest-environment jsdom` at the top).

### An e2e spec (layer 1D)

Add `<name>.spec.ts` to `e2e/`. Use `test.use({ baseURL: "http://localhost:3010" })`
for the scoped-preview surface, the default `:3003` for the internal app.
Drive by role (`getByRole`) and assert with auto-waiting matchers; no explicit
timeouts. Add the spec's path to `e2e.yml` filters only if it lives outside the
already-watched globs.

### A worker test (API layer)

Add `<name>.test.ts` to `functions/api/`. Use `functions/api/test-harness.ts`:
`seedSchema` in `beforeEach` (isolated storage wipes D1 between tests), then
`call(path, { method, headers, body, client })`. The harness exports
`TEAM_HEADERS`, `CLIENT_HEADERS`, `SERVICE_HEADERS` for the identity classes.
Assert status + JSON; cover the auth path and the 403/404 edges, not just the
happy case.

## Layer 2 — skill testing

Two halves, both in the `pnpm run ci` gate:

- **Static skill lint** (`scripts/lint-skills.mjs`, `pnpm lint:skills`): every
  `.claude/skills/<id>/SKILL.md` has the required frontmatter, its `name`
  matches the directory, and every concrete repo path it references exists.
  Cheap insurance against skill rot. Unit-tested in `scripts/lint-skills.test.mjs`.
- **Mechanical-skill script tests**: the deterministic half of a skill is
  extracted into a `scripts/*.mjs` with a pure function and tested with a
  fixture. Worked examples: `dtcg-to-theme` (DTCG → theme that passes
  `themeSchema`) and `new-client` (the scaffold file tree + valid YAML). The
  pattern extends to the other mechanical skills as their mechanics move into
  scripts — the skill keeps the judgment, the script owns the contract-shaped
  half so it becomes a deterministic test.

Judgment skills (`brief-from-transcript`, `apply-feedback`) are not
deterministic; their fuzzy parts are evaluated with golden-fixture invariants
plus an LLM-as-judge, run as a nightly **non-gating** job rather than in the
gate — informing, not failing, CI.

## Layer 3 — the page "play-test"

Authored interaction checks per prototype page, Storybook-`play`-style. A page
(or flow step) exports a `play` beside its `default` and `meta`, discovered the
same way — so checks live where the page lives and variant pages get them for
free. Play-tests are written against the neutral `PlayContext` from `@design/ui`
(never importing a test framework into client code):

```tsx
export const meta: PageMeta = { title: "Quotes", order: 2 };

export const play: PlayTest = async ({ getByRole }) => {
  await getByRole("heading", { name: "Quotes" }).expectVisible();
  await getByRole("button", { name: "Request quote" }).expectVisible();
};
```

The runner (`e2e/play.spec.ts`, run by `pnpm test:play` and within the
path-filtered `e2e` job) enumerates the discovered play-tests the internal app
registers on `window.hxPlay` (keyed by canonical address), navigates to each,
and executes its `play` against the live page canvas through a DOM adapter
(`app/src/play/`). Still to come: an in-app "Run checks" control (v2) that
reuses the same registry, and per-page × viewport × theme visual regression
(v3). It is the one layer that makes _prototype_ correctness, not just app
correctness, automatically checkable.
