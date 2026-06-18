# PRD-11 — Import from code

**Status:** Built — the `/import-from-code` skill ships; layer-2 skill testing is tracked in [reference/testing.md](../reference/testing.md).
**Owns:** a skill that scaffolds a client's pages, mock data, and components from an existing application repo
**Depends on:** PRD-01 (the target is a contract-valid client folder), PRD-04 (prototyping conventions), PRD-10 (a flow imports as a page-tree flow)
**Governing ADRs:** [0003-module-boundary-rules](../adr/0003-module-boundary-rules.md), [0004-shared-kit-mutation-rule](../adr/0004-shared-kit-mutation-rule.md), [0002-filesystem-is-the-registry](../adr/0002-filesystem-is-the-registry.md), [0014-claude-only-authoring](../adr/0014-claude-only-authoring.md)

## Problem

A client often already has a running application whose code is fresher than any
design file. Standing up a prototype of one of its flows means recreating screens
by hand. Pointing Claude at the source repo and naming a flow should scaffold
that flow into the client folder directly — turning existing code into a
playground prototype that honors the contract and the boundary rules.

## Design

### `/import-from-code` skill

- **Inputs:** a source repo (path or URL), the client id (must exist), and the
  name of a flow or set of screens to import.
- **Reads** the source repo to identify the named flow's screens, their
  navigation order, the data each consumes, and the components each composes — it
  does not copy the source wholesale.
- **Writes**, into `clients/<id>/` only, a contract-valid result:
  - **Pages** in `pages/` — a single screen as a file, an ordered journey as a
    files-or-folders flow (PRD-10), each with a `meta` export; built from
    `@design/ui` kit components, falling back to client `components/` wrappers
    where the kit has no equivalent (the kit-mutation rule holds — the kit is
    never edited to fit one client; ADR
    [0004](../adr/0004-shared-kit-mutation-rule.md)).
  - **Mock data** in `data/` — typed TypeScript fixtures, plausible but
    **obviously fictional**: the skill translates the source's real data shapes
    into fictional fixtures and never copies real client data, PII, secrets, or
    proprietary content out of the source repo.
  - **Components** in `components/` for client-specific UI the kit does not
    cover, flagged `promoteCandidate` where genuinely reusable.
- Honors every boundary rule: no cross-client imports, no import of app
  internals, client code imports only `@design/ui` and its own folder (ADR
  [0003](../adr/0003-module-boundary-rules.md)).
- Output passes the full gate (lint, format, boundaries, typecheck, build) with
  no manual fixes, then commits.

### Fidelity stance

The import produces a faithful prototype of the flow's structure and
interaction, not a port of the source's implementation. Backend calls become
mock-data reads; auth, permissions, and persistence are illusions the
real-vs-mocked handoff section (PRD-07) later declares. The skill surfaces what
it could not faithfully reproduce rather than inventing behavior.

## Behavior / acceptance

1. `/import-from-code <repo> marlow "patient intake"` scaffolds the intake flow
   as contract-valid pages, typed fictional mock data, and any needed client
   components — CI green, PR touches only `clients/marlow/**`.
2. A multi-screen journey imports as a files-or-folders flow (PRD-10), single
   screens as page files.
3. No real client data, PII, secret, or source-only proprietary string appears
   in the result; mock data is obviously fictional.
4. The result imports only `@design/ui` and the client's own folder — boundaries
   green.

## Non-goals

- Porting the source's backend, auth, or persistence — those become mocks.
- Importing styling verbatim — the prototype renders under the client's theme
  (PRD-02), not the source's CSS.
- A two-way sync back to the source repo — import is one-directional.
