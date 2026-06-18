# 0006 — Experiments, variants, graduation

**Status:** Accepted

## Context

A prototype explores competing design directions before one is chosen.
Mary needs to build several answers to a design question, switch between
them live for a client, and then settle on one — without git ceremony and
without `main` accumulating a permanent museum of every alternative ever
tried.

## Decision

An **experiment is a question**; a **variant is a competing answer**. The
decision is scoped to the experiment, so "chosen" is always chosen _from_ an
explicit set. The structure:
`experiments/<exp>/experiment.yaml` + `variants/<v>/pages/`. An experiment
**always** has `variants/`, even with a single entry — one shape, no special
cases.

Page relationships are filename-derived (ADR-0002), never declared:

- **Override** — a variant page matching a Main page replaces it when viewed
  through the variant.
- **Added** — a variant page with no Main counterpart exists only in the
  variant.
- **Fall-through** — every Main page the variant does not name renders
  unchanged, so a variant view is always a complete, demoable app.

Line-level diffs are never stored; a variant page is a full file.

**Graduation is a merge into Main, not a flag.** Deciding copies the chosen
variant's pages into the client's `pages/`, relocates a declared
experiment-scope theme into the client's `themes/` (ADR-0005), and records
`status: decided`, `chosen`, `decided`, and a one-line `rationale`. Losing
variants stay in git. `archived` closes an experiment without a decision.
Both leave navigation but never git.

## Consequences

- Main `pages/` is always the single canonical prototype — what demos
  default to and what handoff exports — never "main plus a stack of chosen
  overlays."
- Switching a variant is a UI action for Mary; the dock lists discovered
  variants. Neutral codenames stop clients anchoring on whichever option
  sounds newer.
- Graduation is flat and independent per experiment, which is exactly what
  the one-experiment-per-lineage rule preserves (ADR-0012).
- Decisions are auditable in git history; the graduation drift check reads
  that history, so each operation must be its own commit.
