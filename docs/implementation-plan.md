# Implementation plan

The build plan for everything in [`roadmap.md`](roadmap.md) marked Planned, in
dependency order, with the test plan for each step. Each item names the PRD it
realizes, the files it touches, the tests it adds, and the risks. Specs are in
`prds/`; decisions are in `adr/`; this is the sequencing and the how.

## Sequencing

```
Phase 1  Page-tree model (experiments attached to pages)   ← foundation
Phase 2  Flows (page = file or folder)                     ← needs Phase 1
Phase 3  States (colocated states export)                  ← needs Phase 1
Phase 4  Addressing unification                            ← threads through 1–3
Phase 5  Independent skills (import, Linear, Figma)        ← parallel, any time
Phase 6  Testing layers 2 (skills) and 3 (play)            ← cross-cutting
```

Phases 1→4 are one connected effort on the registry, router, and shell, and
should land in order — flows and states both assume the page tree, and the
addressing scheme only makes sense once steps and states exist. Phase 5 is
independent skill work that can run in parallel by anyone. Phase 6 is built
alongside the features it covers (test as you go), with the layer-2/3
infrastructure standing on its own.

Adopting the canonical routes (Phase 4) is a **migration of live routes**, not
an additive change — see the risk notes there.

---

## Phase 1 — Page-tree model

**Realizes:** [`prd-04`](prds/prd-04-prototyping-experiments.md) (planned
section). **Governs:** [`0012`](adr/0012-one-experiment-per-lineage.md).

Today experiments are a separate sidebar group, unattached to the page they
explore (`app/src/shell/SidebarNav.tsx`), and the registry discovers experiments
independently of pages (`app/src/registry/discover.ts`). Target: an experiment
attaches to a page-tree node, navigation nests experiments under their page, and
at most one experiment is in scope per lineage.

**Changes**

- `app/src/registry/schemas.ts` — add a required `page` field to
  `experimentYamlSchema` (the page id the experiment explores): every experiment
  belongs to a page, even one that exists only inside its own variants.
- `app/src/registry/discover.ts` — resolve each experiment to its page; record
  the link on the page/experiment entries. Emit a contract error when `page`
  names no page, or when two experiments resolve to nodes on one lineage
  (enforce ADR-0012).
- `app/src/registry/types.ts` — `PageEntry` gains `experiments: ExperimentEntry[]`
  (the experiments attached at or below it); `ExperimentEntry` gains `page`.
- `app/src/shell/SidebarNav.tsx` — render a page tree; show each page's
  experiments/variants inline (the variant switch in context, not a separate
  list).
- `clients/marlow/experiments/*/experiment.yaml` — add `page:` to the fixtures.

**Tests**

- Registry contract (`app/src/registry/discover.test.ts`): an experiment with an
  unresolved `page` is an error; two experiments on one lineage is an error; a
  valid linkage resolves with zero errors. Add broken-fixture cases.
- Schema (`app/src/registry/schemas.test.ts`): `page` optional, typed.
- e2e (`e2e/internal.spec.ts`): the sidebar shows experiments nested under their
  page; switching a variant stays on the page.

**Risks.** The lineage-uniqueness check is the subtle part — get the
root-to-leaf path logic right and cover it with the broken-fixture tests.

---

## Phase 2 — Flows (page = file or folder)

**Realizes:** [`prd-10`](prds/prd-10-flows-and-states.md). **Governs:**
[`0010`](adr/0010-pages-are-files-or-folders.md).

A page becomes either a file (`pages/dashboard.tsx`) or a folder
(`pages/request-quote/` of ordered step files). The reference migration is the
existing wizard
(`clients/marlow/experiments/quote-flow/variants/banksia`), which today is
sibling pages joined by `window.location.assign` in `shared/wizard.tsx`.

**Changes**

- `app/src/registry/discover.ts` — extend page discovery: glob `pages/*/*.tsx`
  (and the variant equivalents) as flow steps. A folder yields a flow
  `PageEntry` with an ordered `steps: PageEntry[]` (by `meta.order` then
  filename). A single `.tsx` stays a leaf page. Apply the same `VITE_CLIENT`
  glob-narrowing the scoped build relies on (`app/vite.config.ts`).
- `app/src/registry/types.ts` — `PageEntry.steps?: PageEntry[]`.
- `app/src/main.tsx` — add the step route segment (see Phase 4 for the final
  shape); render a flow shell (stepper + active step) for flow pages.
- `app/src/shell/SidebarNav.tsx` — flow pages are expandable parents; clicking a
  flow lands on step 1 and expands the steps.
- New `app/src/shell/Flow.tsx` (or fold into the canvas) — the stepper +
  SPA prev/next, replacing `window.location.assign`.
- `clients/marlow/experiments/quote-flow/variants/banksia/pages/` — migrate the
  four sibling step files into a `new-quote/` folder (the page id the experiment
  explores); the stepper and Back/Next move into the shell's flow renderer, so
  `shared/wizard.tsx` keeps only the shared input styling. This is the worked
  example.

**Tests**

- Contract (`discover.test.ts`): a folder page discovers as a flow with ordered
  steps; a file stays a leaf; step ordering honors `meta.order`.
- Render-smoke (`app/src/test/render-smoke.test.tsx`): every flow step renders
  (it already enumerates variant pages — extend the case-builder to descend into
  flow folders).
- e2e (`e2e/internal.spec.ts`): clicking a flow lands on step 1, the stepper
  navigates without a full reload, and the best-effort coordinate preservation
  rule holds when switching a flow variant to a non-flow variant.

**Risks.** `window.location.assign` → SPA nav must keep the comment overlay and
viewport state alive across steps. Flow is one level deep (ADR-0010) — reject a
step that is itself a folder in discovery.

---

## Phase 3 — States

**Realizes:** [`prd-10`](prds/prd-10-flows-and-states.md). **Governs:**
[`0011`](adr/0011-states-as-colocated-exports.md).

A page or step exports named states as scenario thunks; the shell can flip
between them and each is deep-linkable.

**Changes**

- `app/src/registry/schemas.ts` — a `statesSchema` (a record of state name →
  function).
- `app/src/registry/discover.ts` / `parsePageModule` — read the optional
  `states` export; record `PageEntry.states?: Record<string, ComponentType>`.
- `app/src/registry/types.ts` — `PageEntry.states`.
- `app/src/shell/` — a state switcher on the dock (internal) and the client
  toolbar (a client reviews states too); render the selected state thunk instead
  of the default component. Drive it from the `?state=` param (Phase 4).
- `clients/marlow/pages/*.tsx` — add representative `states` (empty/error) to a
  couple of pages as the worked example and as render-smoke/​play fixtures.

**Tests**

- Contract (`discover.test.ts`): states discovered and named; a malformed
  `states` export degrades to a contract error, not a crash.
- Render-smoke: extend the case-builder to render every named state of every
  page (this is the cheapest, highest-value coverage — a broken state fails
  here).
- e2e: the state switcher flips the render; `?state=empty` deep-links to it.

**Risks.** States must not leak into production scoped builds as separate routes
unless intended — confirm `verify:scoped` still passes (states are render
variations of one route, so they should not add routes).

---

## Phase 4 — Addressing unification

**Realizes:** [`prd-10`](prds/prd-10-flows-and-states.md). **Governs:**
[`0013`](adr/0013-canonical-addressing-scheme.md).

One canonical address per reviewable surface:
`/c/<client>/[x/<exp>/<variant>/]p/<page>[/<step>][?state=<state>][#<anchor>]`.

**Changes**

- New `app/src/shell/address.ts` — pure parse/build of the canonical address
  from its coordinates (design, page, step, state). The single place routing,
  nav, and comment anchoring agree on.
- `app/src/main.tsx` — migrate routes to the canonical shape (add `/p/`, the
  step segment, the `state` param). The current routes
  (`/c/:clientId/x/:experimentId/:variantId/:pageId`) change — update every
  `navigate()`/`<Link>` and the experiment-link builder in `SidebarNav.tsx`.
- `app/src/shell/AppShell.tsx` / `theme.ts` — extend the route matching that
  resolves the current client/experiment/variant to also resolve step and state.
- `app/src/shell/comments/*` — the thread `route` is already free-form, so the
  store is unchanged; ensure new threads capture the full canonical route and
  that `resolveThread` reopens on the right step/state.
- Implement best-effort coordinate preservation in the switch handlers (variant,
  theme, state): keep page/step/state where they exist in the target, drop to
  the nearest valid parent otherwise.

**Tests**

- Unit (`app/src/shell/address.test.ts`): parse↔build round-trips for every
  coordinate combination; preservation logic (target has/has-not the step/state).
- e2e: deep-link to a full address reopens the exact surface; a comment left on
  `step/?state=` reopens there; switching coordinates preserves the rest
  best-effort.

**Risks.** This is a live-route migration. Land it behind the same gate, verify
the scoped preview still boots to the client's first page, and check that
existing stored threads (whose `route` predates `/p/`) still resolve or degrade
gracefully — add a normalization for legacy routes if any exist in D1.

---

## Phase 5 — Independent skills

Parallelizable, no dependency on Phases 1–4.

### Import from code — [`prd-11`](prds/prd-11-import-from-code.md)

- New `.claude/skills/import-from-code/SKILL.md` (`/import-from-code`): point
  Claude at a source repo, name a flow, scaffold pages + typed mock data +
  components into `clients/<id>/` per the contract, honoring boundary rules and
  fictional-data-only.
- **Tests** (layer 2, see Phase 6): a fixture source tree → run the skill's
  mechanics → assert the scaffolded folder discovers with zero contract errors
  and `pnpm run ci` passes.

### Feedback from Linear — [`prd-12`](prds/prd-12-linear-integration.md)

- New `.claude/skills/feedback-from-linear/SKILL.md`: ingest Linear issues into
  comment threads/experiments via the Linear MCP, dedup by issue id, optionally
  post preview URLs back.
- **Tests:** MCP-dependent, so an eval (layer 2) rather than a unit test — a
  fixture issue set → assert threads created and deduplicated. Not a gate.

### Figma import validation — [`prd-02`](prds/prd-02-design-system-theming.md)

- Exercise `theme-from-figma` + `scripts/dtcg-to-theme.mjs` against a captured
  DTCG/variables export fixture; fix whatever breaks.
- **Tests:** `dtcg-to-theme.mjs` is a pure script — add `scripts/dtcg-to-theme.test.mjs`
  (a fixture DTCG document → assert a valid theme YAML that passes `themeSchema`).
  This closes the "shipped but unvalidated" gap.

---

## Phase 6 — Testing layers 2 and 3

Layer 1 is complete (see [`reference/testing.md`](reference/testing.md)). This
phase builds the two remaining layers from
[`0009`](adr/0009-automated-testing-layers.md).

### Layer 2 — skill testing

**Mechanical skills** (`new-client`, `new-variant`, `new-theme`,
`archive-experiment`, `decide-experiment`, `promote-component`): push the
deterministic mechanics into scripts (the pattern already exists —
`scripts/handoff.mjs`, `dtcg-to-theme.mjs`, `verify-scoped-build.mjs`), then
test the script:

1. From a fixture repo state, run the operation into a temp dir.
2. Snapshot-assert the resulting file tree.
3. Assert `discoverClients` finds the new entity with **zero** contract errors.
4. Assert `pnpm run ci` passes on the result.

This makes the contract-shaped half of each skill a deterministic test and
shrinks the surface that depends on the agent doing the right thing.

**Static skill lint** (cheap, high value): a script
(`scripts/lint-skills.mjs`) validating every `SKILL.md` — required frontmatter
present, referenced scripts/paths/globs exist, declared arguments resolve. Wire
`pnpm lint:skills` into the `ci` chain. Catches skill rot for near-zero cost.

**Judgment skills** (`brief-from-transcript`, `apply-feedback`): golden-fixture
invariant tests (given a fixed transcript, the brief contains the agreed
decisions, invents no client, holds the traceability rule) plus an LLM-as-judge
eval for the fuzzy parts. Run as a nightly, non-gating job — non-deterministic,
so it informs rather than fails CI.

### Layer 3 — page play-tests

Authored interaction checks per page, Storybook-`play`-style, reusing the
`states` fixtures from Phase 3.

1. **Contract + runner (MVP).** Define a `PlayTest` type and a `play` export
   discovered like `meta` (`parsePageModule` in `discover.ts`). A Playwright
   runner enumerates discovered pages, navigates to each canonical address, and
   runs its `play` against a scoped canvas locator. Add `pnpm test:play` as a
   path-filtered CI job alongside e2e.
2. **In-app runner (v2).** A per-page "Run checks" control in the shell that runs
   the page's `play` live and shows step results — the Storybook-play analogue
   inside the playground.
3. **Visual regression (v3).** Playwright screenshots per page × viewport ×
   theme × state, diffed against baselines, reusing the screenshot path
   `scripts/handoff.mjs` already drives.

### CI wiring summary

| Test work                                       | Where it runs                 |
| ----------------------------------------------- | ----------------------------- |
| Phase 1–4 contract/unit/render tests            | `pnpm run ci` (always)        |
| Phase 1–4 e2e additions                         | the path-filtered `e2e` job   |
| `dtcg-to-theme` + mechanical-skill script tests | `pnpm run ci` (Node-local)    |
| Static skill lint                               | `pnpm run ci`                 |
| Judgment-skill evals                            | nightly, non-gating           |
| Play-tests                                      | path-filtered `test:play` job |

The rule from [`0015`](adr/0015-e2e-outside-pre-push-gate.md) holds: browser
suites stay out of the pre-push replay; Node-local suites stay in it.

---

## Suggested milestones

1. **M1 — Page tree.** Phase 1. Unlocks everything; small and self-contained.
2. **M2 — Flows.** Phase 2 + the wizard migration as the worked example.
3. **M3 — States + addressing.** Phases 3 and 4 together (states need the
   `?state=` route; addressing is the migration that carries both).
4. **M4 — Skills.** Phase 5, parallelizable; do Figma validation first (smallest,
   closes a known gap).
5. **M5 — Test depth.** Phase 6: static skill lint and mechanical-skill tests
   first (cheap, in-gate), then play-tests, then judgment evals.

Each milestone is a green `pnpm run ci`, its own branch and PR, and a flipped row
in [`roadmap.md`](roadmap.md) plus the owning PRD's status header.
