# 0012 — At most one experiment per lineage

**Status:** Accepted

## Context

Steps are pages (ADR-0010), so the page tree could host an experiment on a
flow and a separate experiment on one of that flow's steps — two experiments
in scope on the same root-to-leaf path. Allowing that overlap means a single
view depends on more than one variant selection at once. The full flows and
states design is in [`prd-10`](../prds/prd-10-flows-and-states.md).

## Decision

An experiment may attach to any node in the page tree — a page, a flow, or a
step — but **no two experiments may be in scope on the same root-to-leaf
path**. At most one experiment is in scope for any given route.

To compare two designs of a step, scope the experiment to that step and do
not also run one on the parent flow. Many experiments may live across the
tree; just not stacked on one lineage.

## Consequences

- The canonical address keeps a single `x/<experiment>/<variant>` segment
  (ADR-0013); the UI needs one variant selector.
- Each experiment's graduation stays independent and flat (ADR-0006) — no
  ordering rule, no orphaning a child experiment when a parent decides.
- "One address per thing" stays literally true.

## Alternatives

**Allow overlapping or nested experiments.** Rejected for now: the URL would
have to encode a _set_ of experiment→variant choices that every consumer
(nav, comment anchoring, handoff, scoped-preview routing) must round-trip,
the UI would need one selector per in-scope experiment, and graduation would
become order-dependent with orphan rules. Lifting the constraint is a real
feature, not a tweak.

### Decision tree — lifting this constraint

1. **Do you actually need two experiments in scope on the same path at once?**
   - No → keep the constraint; scope each experiment to the narrowest node and
     never stack on a lineage. Stop here.
   - Yes → continue.
2. **Can the two be sequenced instead of simultaneous** — decide the parent,
   then open the child experiment on the won realization?
   - Yes → prefer this; the child only exists after the parent graduates, so
     they are never in scope together and no model change is needed.
   - No, they must coexist → implement true overlap, which requires:
     - **Addressing:** the route encodes a _set_ of selections (e.g.
       `?x=quote-flow:banksia,schedule-design:v2`); every consumer (nav,
       comment anchoring, handoff, scoped-preview routing) must round-trip it.
     - **UI:** one variant selector per in-scope experiment, scoped so a
       reviewer knows which governs which part of the screen.
     - **Graduation:** ordering and orphan rules — when the parent decides,
       migrate / archive / block a child experiment that lived on a discarded
       realization.
     - **Discovery + validation:** represent the in-scope set per route and
       define what an invalid combination degrades to.
   - Justify the cost against a concrete, recurring engagement need.
