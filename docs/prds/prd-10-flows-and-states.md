# PRD-10 — Flows, states & addressing

**Status:** Built — pages as files-or-folders (flows), colocated named states, and the canonical addressing scheme.
**Owns:** the page-tree model (pages as files or folders), named screen states, the canonical addressing scheme, and the navigation rules over them
**Depends on:** PRD-04 (experiments attach to page-tree nodes), [client folder contract](../reference/client-folder-contract.md)
**Governing ADRs:** [0010-pages-are-files-or-folders](../adr/0010-pages-are-files-or-folders.md), [0011-states-as-colocated-exports](../adr/0011-states-as-colocated-exports.md), [0012-one-experiment-per-lineage](../adr/0012-one-experiment-per-lineage.md), [0013-canonical-addressing-scheme](../adr/0013-canonical-addressing-scheme.md)

## Problem

A real prototype is more than a flat list of single screens. A journey has
ordered steps; a screen has named conditions (empty, loading, error). Every one
of those is a reviewable surface, and a comment or a deep link must be able to
address exactly one of them. Without a model, multi-step flows are faked as
loose sibling pages, screen states have nowhere to live, and there is no single
URL for "the empty state of the schedule step of the wizard variant."

## Design

### The dimensions

A reviewable surface is a point in a coordinate space of four orthogonal axes:

| Axis   | Question              | Form                                    |
| ------ | --------------------- | --------------------------------------- |
| Design | Which design?         | Main, or experiment + variant           |
| Page   | Which screen?         | a page id (a node in the page tree)     |
| Step   | Where in the journey? | a step id, only when the page is a flow |
| State  | Which condition?      | a named state, or the default           |

### Pages are files or folders

A page is **either a file or a folder** (ADR
[0010](../adr/0010-pages-are-files-or-folders.md)):

- `pages/dashboard.tsx` — a single screen.
- `pages/request-quote/` — a **flow**: an ordered sequence of step screens, one
  file per step (`01-lane.tsx`, `02-freight.tsx`, …), ordered by `meta.order`
  then filename. Each step is a page in its own right.

The page id is the same either way (`request-quote`), so whether a page is a flow
is not a property of the page — it is a property of the realization a variant
provides. A flow is at most one level deep: a step is a single screen, never
itself a flow.

Because variants override at the page level, the same logical page can be a flow
in one variant and a single screen in another — the wizard variant supplies
`request-quote/` (a folder of steps), the form variant supplies
`request-quote.tsx` (one long form). The shell renders whatever the active
variant realizes. The sidebar reflects it: a flow page is an expandable parent
whose children are its steps; a single page is a leaf.

### States

A state is a named condition of a screen — `empty`, `loading`, `error`,
`modal-open`, `row-selected` — authored as a colocated export on the page (or
step) file (ADR [0011](../adr/0011-states-as-colocated-exports.md)), each a thunk
rendering the component under that condition:

```tsx
export const meta: PageMeta = { title: "Dashboard", order: 1 };

export const states = {
  empty: () => <Dashboard consignments={[]} />,
  error: () => <Dashboard error="Network timeout" />,
  loading: () => <Dashboard loading />,
};

export default function Dashboard(/* normal render = the default state */) { ... }
```

- Discovered like `meta` — no new YAML, no registration.
- The default render (the component itself) is the implicit `default` state.
- State lives in the page file, so a variant that overrides the page provides its
  own states by virtue of being a different file. State is page-level and
  variant-replaceable; there is no separate rule for it.
- The same `states` map is the fixture set the page's play-tests assert against
  (see [testing](../reference/testing.md), layer 3).

### Addressing

Every reviewable surface has one canonical address (ADR
[0013](../adr/0013-canonical-addressing-scheme.md)). The route encodes the
coordinate; the fragment anchors a comment within it:

```
/c/<client>/[x/<experiment>/<variant>/]p/<page>[/<step>][?state=<state>][#<anchor>]
```

- no `x/…` segment → Main; `x/quote-flow/banksia` → that variant
- `/<step>` present only when the page resolves to a flow
- `?state=empty` selects a named state; absent → the default
- `#<anchor>` → the element / token / kit / selector anchor (PRD-05)

So "the empty state of the schedule step of the wizard variant of request-quote,
anchored to the submit button" is a single URL. The comment thread store already
carries free-form `route`, `anchor`, and `viewport`, so this is a routing and
navigation concern, not a thread-API change. **Events are not addressable** —
they are transient; model the outcome of an event as a state
(`?state=after-submit`).

### Navigation rules

- **Clicking a flow page** in the sidebar lands on its first step and expands the
  step list. Clicking a single page just opens it.
- **Switching one coordinate preserves the others, best-effort.** Changing the
  variant (or theme, or state) keeps the page, step, and state _if they exist in
  the target_ and falls back to the nearest valid parent otherwise. Switching
  from the wizard's `schedule` step to the form variant (no steps) keeps the
  logical page `request-quote` and drops to its single screen; switching to
  another wizard variant that also has a `schedule` step keeps the step, so
  step-vs-step comparison holds position. Same principle as theme switching:
  change one axis, keep the rest.

### Graduation

Deciding an experiment stays a flat merge: the chosen variant's realization of
the page is copied into Main. A flow graduates as a unit — the whole
`request-quote/` folder moves, or the single `request-quote.tsx` does, depending
on which variant won. States ride along inside the page files. No special
graduation handling for flows or states.

### At most one experiment per lineage

An experiment may attach to any node in the page tree (a page, a flow, or a
step), but **no two experiments are in scope on the same root-to-leaf path** (ADR
[0012](../adr/0012-one-experiment-per-lineage.md)). This keeps the canonical
address a single `x/<experiment>/<variant>` segment, keeps each experiment's
graduation independent and flat, and keeps "one address per thing" true. To
compare two designs of a step, scope the experiment to that step and do not also
run one on the parent flow.

## Behavior / acceptance

1. `pages/request-quote/01-lane.tsx` + `02-freight.tsx` render as an expandable
   flow in the sidebar; clicking the flow lands on step 1.
2. A page exporting a `states` map exposes each state at `?state=<name>`; the
   default render is `?state` absent.
3. The address `/c/marlow/x/quote-flow/banksia/p/request-quote/schedule?state=empty`
   resolves to exactly that surface and round-trips through nav, comment
   anchoring, and scoped-preview routing.
4. Switching from a wizard step to a stepless variant keeps the logical page and
   drops to its single screen; switching to a sibling wizard step keeps the step.
5. Deciding the experiment graduates the won realization as a unit, states
   included.

## Non-goals

- Flows deeper than one level — a step is never itself a flow.
- Addressable events — model their outcomes as states.
- Overlapping or nested experiments on one lineage (ADR
  [0012](../adr/0012-one-experiment-per-lineage.md) records the cost of lifting
  this; do not until a concrete, recurring need justifies it).
