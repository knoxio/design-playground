# PRD-01 — Client lifecycle

**Status:** Built
**Owns:** C3 (client scaffolding skill), C4 (filesystem discovery)
**Depends on:** [client folder contract](../reference/client-folder-contract.md)
**Governing ADRs:** [0001-one-app-clients-as-folders](../adr/0001-one-app-clients-as-folders.md), [0002-filesystem-is-the-registry](../adr/0002-filesystem-is-the-registry.md), [0003-module-boundary-rules](../adr/0003-module-boundary-rules.md), [0014-claude-only-authoring](../adr/0014-claude-only-authoring.md)

## Problem

Mary onboards a client without engineering review, and adding a client never
touches protected app code — that autonomy is what the merge-on-green
architecture rests on. A client folder also has to match the contract on the
first try: hand-creating files in the right shape and hoping they are valid is
not a workflow a non-coder can own.

## Design

### Filesystem discovery

The app discovers everything from the tree per the [client folder
contract](../reference/client-folder-contract.md) — there is no registration
file of any kind:

| Entity     | Discovered from                     | Identity    |
| ---------- | ----------------------------------- | ----------- |
| client     | `clients/*/client.yaml`             | folder name |
| page       | `clients/<id>/pages/*.tsx` + `meta` | filename    |
| theme      | `<scope>/themes/*.yaml`             | filename    |
| experiment | `experiments/*/experiment.yaml`     | folder name |
| variant    | `experiments/<e>/variants/*/`       | folder name |

- `app/src/registry/` owns the globs (`import.meta.glob`) and is the single
  sanctioned door between the app and client code (ADR
  [0003](../adr/0003-module-boundary-rules.md)); nothing else in `app/` imports
  `clients/`.
- Every YAML is validated against its zod schema at discovery
  (`app/src/registry/schemas.ts`). A malformed file or a missing required field
  degrades to an error card naming the file and the violation — never a white
  screen, never collateral damage to another client. Discovery emits typed
  entries plus an `errors[]` array (the contract written as code; see
  [testing](../reference/testing.md)).
- `VITE_CLIENT=<id>` narrows the glob at build time so a scoped build never
  imports another client (physical exclusion is PRD-06).

### `/new-client` skill

Scaffolds `clients/<id>/` exactly per the contract:

- **Inputs:** `id` (kebab-case — lowercase letters, digits, hyphens; must not
  already exist), display `name`, optional source client whose default theme is
  forked (default: fork the global `themes/helix.yaml`).
- **Writes:** `client.yaml` (name, optional description, `defaultTheme:
default`), `CLAUDE.md` (brief template with TODO markers — PRD-03 fills it),
  `themes/default.yaml` (forked, choice comments preserved), `pages/home.tsx`
  (minimal, kit-only, `meta` + default export), and empty `components/`,
  `data/`, `docs/` (`.gitkeep` where git needs it).
- The skill never writes outside `clients/<id>/`. Output passes lint, format,
  typecheck, and boundaries with zero manual fixes, then commits (one operation,
  one commit).

## Behavior / acceptance

1. `/new-client marlow` then `pnpm dev` — the client appears on the overview;
   the PR touches only `clients/marlow/**` and CI is green.
2. Removing `client.yaml`'s `name` produces an error card for that client; every
   other client still renders.
3. Adding `pages/about.tsx` with a `meta` export makes it appear in nav with no
   other change anywhere.
4. `git grep -l "clients/" app/src` returns only files under
   `app/src/registry/`.

## Non-goals

- Deleting or renaming clients (manual, rare, engineer-assisted).
- Experiment and variant tooling (PRD-04); discovery of those entities lands
  here because discovery is one mechanism.

## Open questions

- Overview ordering is alphabetical until it annoys someone, then a `sortKey` in
  `client.yaml`.
