---
name: import-from-code
description: Scaffold a client's pages, mock data, and components from an existing application repo. Use when a client already has a running app and you want to stand up a prototype of one of its flows in the playground.
---

# Import from code

Turn an existing application's flow into a contract-valid prototype inside a
client folder. The source is a reference for structure and interaction, **not**
a port — backend calls become mock-data reads, and nothing is copied wholesale.
Realizes [`prd-11`](../../../docs/prds/prd-11-import-from-code.md); the folder
contract is `docs/reference/client-folder-contract.md`.

## Inputs

- **source** (required): a path or URL to the source repo.
- **client** (required): an existing client id. The result lands only in
  `clients/<client>/`.
- **flow / screens** (required): the name of the flow or the set of screens to
  import (e.g. "patient intake"). If ambiguous, ask which screens are in scope.

## Steps

1. Read the client's `CLAUDE.md` brief and `docs/reference/client-folder-contract.md`
   if not already in context. The brief's vocabulary and scope govern naming.
2. Read the source to identify, for the named flow: its screens, their
   navigation order, the data each screen consumes, and the components each
   composes. Do not copy source files — extract structure and interaction.
3. Write **pages** into `pages/`:
   - A single screen is a file (`pages/<page>.tsx`); an ordered journey is a
     flow folder (`pages/<page>/<step>.tsx`, ordered by `meta.order`) per
     ADR-0010. Each page/step default-exports a component and exports `meta`.
   - Build from `@helix/ui` kit components first (browse `kitManifest` in
     `packages/ui/src/gallery.tsx`); fall back to a client `components/` wrapper
     only where the kit has no equivalent. **Never edit the kit** to fit the
     import (ADR-0004) — wrap in the client folder instead.
   - Where a screen has obvious named conditions (empty, error), author them as
     a colocated `states` export (ADR-0011) rather than inventing routes.
4. Write **mock data** into `data/` — typed TypeScript fixtures, plausible but
   **obviously fictional**. Translate the source's data _shapes_ into fictional
   fixtures; never copy real client data, PII, secrets, or proprietary strings
   out of the source. No network calls.
5. Write **components** into `components/` only for client-specific UI the kit
   doesn't cover; flag genuinely reusable ones with `promoteCandidate = true`
   and a one-line why.
6. Style only through tokens and token-backed Tailwind utilities — the prototype
   renders under the client's theme (PRD-02), never the source's CSS.
7. Surface what you could **not** faithfully reproduce (a screen that depends on
   live data you mocked, an interaction you simplified) in the PR description —
   do not invent behavior to fill the gap.
8. Run `pnpm run ci`. It must pass with zero manual fixes; the diff touches only
   `clients/<client>/**`. Then commit (one commit for the import).

## Rules

- Never write outside `clients/<client>/`. No cross-client imports, no app
  internals — client code imports only `@helix/ui` and its own folder (ADR-0003).
- Import is one-directional: no sync back to the source repo.
- Fictional data only — the rule is enforced by the scoped build, not advisory.
