# 0011 — States as colocated exports

**Status:** Accepted

## Context

A screen has named conditions worth reviewing on their own: `empty`,
`loading`, `error`, `modal-open`, `row-selected`. Each must be deep-linkable
and commentable (ADR-0013), and a variant that overrides a page should carry
its own states without a separate registration rule; the full design is
[`prd-10`](../prds/prd-10-flows-and-states.md).

## Decision

States are authored as a colocated `states` export on the page (or step)
file — a map of named thunks, each rendering the component under that
condition, typically by feeding different mock data or props:

```tsx
export const meta: PageMeta = { title: "Dashboard", order: 1 };

export const states = {
  empty: () => <Dashboard consignments={[]} />,
  error: () => <Dashboard error="Network timeout" />,
};

export default function Dashboard(/* default render = the default state */) { ... }
```

- Discovered like `meta` — no new YAML, no registration (ADR-0002).
- The default render is the implicit `default` state.
- State lives in the page file, so a variant that overrides the page provides
  its own states by virtue of being a different file. State is page-level and
  variant-replaceable; there is no separate rule for it.

Events are **not** addressable — they are transient. Model an event's
outcome as a state (`after-submit`) instead.

## Consequences

- A state is one URL coordinate (`?state=empty`) and a comment can anchor to
  it (ADR-0013).
- The same `states` map is the fixture set the page's play-tests assert
  against (ADR-0009) — authored once, used for both review and testing.
- States ride along inside page files during graduation; no special handling
  (ADR-0006).
