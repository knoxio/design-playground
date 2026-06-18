# PRD-04 — Prototyping conventions & experiment lifecycle

**Status:** Built — variant rendering, the dock, promotion candidates, the
lifecycle (active/decided/archived, graduation-as-merge), and experiments
attached to pages with page-tree navigation. The files-or-folders flow model
that extends the page tree is tracked in [prd-10](prd-10-flows-and-states.md).
**Owns:** C8 (prototyping conventions), C9 (experiment/variant lifecycle), C10 (kit promotion path)
**Depends on:** PRD-01, [client folder contract](../reference/client-folder-contract.md)
**Governing ADRs:** [0006-experiments-variants-graduation](../adr/0006-experiments-variants-graduation.md), [0004-shared-kit-mutation-rule](../adr/0004-shared-kit-mutation-rule.md), [0012-one-experiment-per-lineage](../adr/0012-one-experiment-per-lineage.md), [0010-pages-are-files-or-folders](../adr/0010-pages-are-files-or-folders.md)

## Problem

An experiment is a question; its variants are the competing answers. The
contract defines override semantics and merge-on-decide graduation; that needs
an implementation: a way to flip between variants while screen-sharing, skills
that create the structure correctly, a mechanized decision step, and a visible
queue of kit-promotion candidates instead of Mary's memory. Navigation also has
to express that an experiment belongs to a page — a reviewer flips designs of a
screen by selecting the variant in place on that screen.

## Design — Built

### Variant rendering

Viewing "through" a variant renders the client's main `pages/` with the
variant's `pages/` overlaid by relative path (contract semantics): a variant
file with the same name as a Main page overrides it, a new name is a
variant-only addition, and every un-named Main page falls through unchanged — so
the variant view is always a complete, demoable app. Line-level diffs are never
stored; "make the variant override the quotes page" means creating the file.

### The dock

A floating, glass-styled pill at bottom-center of the prototype shows the current
context (experiment · variant, or "Main"). Clicking opens a panel listing Main
plus every variant; the chosen variant is badged — two clicks to flip during a
screen-share. Bottom-center is deliberate: it reads as part of the prototype,
survives sidebar collapse, and is where the other prototype tools (comments,
viewport) mount. Internal builds only — PRD-06 strips it.

- The **Main** option never teleports: it keeps the current page when Main has
  it; on a variant-only addition it renders disabled with "this page only exists
  in this variant".
- `decided` and `archived` experiments render nowhere; their files stay in git.

### `/new-experiment`, `/new-variant`, `/decide-experiment`, `/archive-experiment`

- **`/new-experiment`** creates `experiments/<id>/experiment.yaml` (`name`,
  `question`, `status: active`, optional `theme`, optional variant display
  names) plus `variants/<v>/pages/` (≥1 variant; default one `v1`), optionally
  seeding variants from named Main pages and fixing relative imports.
- **`/new-variant`** adds a variant to an active experiment — forked from a
  sibling, seeded from Main, or empty — and differentiates a fork toward its
  stated direction.
- **`/decide-experiment`** executes graduation per the contract: drift-checks
  each overridden Main page, copies the chosen variant's pages into Main, moves
  a declared experiment-scoped `theme` into the client's `themes/` (and any
  `shared/` code Main now needs into `components/`), writes `status: decided`,
  `chosen`, `decided`, `rationale`, and appends the decision to the brief's
  decision log. Losing variants stay in git untouched. It refuses if the variant
  does not exist or the experiment is not `active`.
- **`/archive-experiment`** sets `status: archived` (closed without a decision),
  deletes nothing, and logs the reason. Both `decided` and `archived`
  experiments leave navigation but never git.

### Mock-data conventions

Fixtures live in `clients/<id>/data/` — typed TypeScript modules, no network,
plausible but obviously fictional (no real company names, no PII). Mock data
ships in client previews, so the rule is enforced, not advisory. Skill page
templates demonstrate the import pattern.

### Promotion candidates

A client component exports `promoteCandidate = true` with the one-line _why_ as
a trailing comment — an export, not a JSDoc tag, so it is both runtime-readable
(the Components gallery badges it) and greppable (`pnpm promotion-candidates`
lists them across clients). Promotion itself is a deliberate, core-owner-reviewed
PR (`/promote-component`); the flag is a queue, not an action.

## Design — Experiments attached to pages

The navigation model is a **page tree** with per-page variant switching in
place. It builds on the files-or-folders page model (ADR
[0010](../adr/0010-pages-are-files-or-folders.md)) and the states model
([prd-10](prd-10-flows-and-states.md)); the addressing and navigation rules are
specified in [prd-10](prd-10-flows-and-states.md).

- **An experiment declares the page-tree node it explores** via a required
  `page:` field in `experiment.yaml` (a page, a flow, or a step). The id
  resolves against Main pages and the pages the experiment's own variants
  introduce, so an experiment may explore a page that exists only for it;
  page relationships within a variant stay filename-derived, never listed.
- **At most one experiment is in scope on any root-to-leaf path** (ADR
  [0012](../adr/0012-one-experiment-per-lineage.md)) — discovery rejects a
  second active experiment on a lineage. The canonical address keeps a single
  `x/<experiment>/<variant>` segment, and each experiment's graduation stays
  independent and flat.
- **The page tree shows variant switching in place** for the experiment's node:
  the sidebar presents the experiment under its page with Main plus each variant
  inline, and the dock flips that page's variants where the page renders, rather
  than listing experiments as a nav group divorced from their page.
- Graduation is unchanged in shape — the chosen variant's realization of the
  node (a single file or a whole flow folder) merges into Main; states ride
  along inside the page files.

## Behavior / acceptance

1. `/new-experiment marlow quote-flow --variants juniper,banksia` produces a
   contract-valid structure that passes CI untouched.
2. With a variant overriding `quote.tsx`, the dock flips Main ↔ juniper ↔ banksia
   in two clicks; non-overridden pages are identical across variants.
3. `/decide-experiment marlow quote-flow banksia "..."` leaves Main `pages/`
   containing banksia's pages, the experiment `decided`, the brief's decision log
   appended, and nothing rendering for the experiment.
4. `pnpm promotion-candidates` lists a flagged component.
5. An experiment declares its page node; the sidebar presents it under that page
   and the dock flips its variants in place; no two experiments are in scope on
   one lineage.

## Non-goals

- Voting on variants — deciding is Mary's call, recorded by graduation.
- Cross-variant diff visualization — comparison is by flipping, not by rendering
  diffs.
- Automated conflict handling when graduation overwrites a Main page changed
  since the variant forked — the skill warns and shows the diff; Mary resolves.
- Overlapping or nested experiments on one lineage (ADR
  [0012](../adr/0012-one-experiment-per-lineage.md) records the cost of lifting
  this).
