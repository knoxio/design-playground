# 0010 — Pages are files or folders

**Status:** Accepted

## Context

Some screens are a single view; others are a journey of ordered steps (a
quote wizard, an onboarding sequence). A variant may realize the same logical
page either way: one variant offers a single long form, another offers a
multi-step wizard. The page model must hold both without making "is this a
flow?" a declared property that a variant override could contradict.

This sits on the page-tree model and is a prerequisite for states (ADR-0011)
and addressing (ADR-0013); the full design is
[`prd-10`](../prds/prd-10-flows-and-states.md).

## Decision

A page is **either a file or a folder**:

- `pages/dashboard.tsx` — a single screen.
- `pages/request-quote/` — a **flow**: an ordered sequence of step files
  (`01-lane.tsx`, `02-freight.tsx`, …), ordered by `meta.order` then
  filename. Each step is a page in its own right.

The page **id is the same either way** (`request-quote`). Flow-ness is not a
property of the page — it is a property of the realization a variant
provides. A flow is at most **one level deep**: a step is a single screen,
never itself a flow.

Because variants override at the page level (ADR-0006), the same logical page
is a flow in one variant and a single screen in another, purely by being a
folder in one and a file in the other. The shell renders whatever the active
variant realizes; the sidebar shows a flow as an expandable parent and a
single page as a leaf.

## Consequences

- No new YAML and no registration: a flow is a folder, discovered like any
  page (ADR-0002).
- Graduation needs no special handling — a flow graduates as a unit (the
  whole folder moves) or the single file does, depending on which variant
  won (ADR-0006).
- Clicking a flow page in the sidebar lands on its first step and expands the
  step list; switching coordinates preserves the others best-effort, falling
  back to the nearest valid parent (ADR-0013).
