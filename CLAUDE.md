# Helix Playground

A prototyping playground for Helix client engagements. A designer (Mary) builds
interactive client prototypes here through Claude Code — she does not edit code
directly. The full product/architecture rationale is in
`docs/overview/architecture.md`; read it before structural changes.

## Structure

- `app/` — playground core: shell, routing, registry, theming. **Protected.**
- `packages/ui/` — `@helix/ui`, the shared component kit. Token-driven, client-agnostic. **Protected.**
- `themes/` — global themes (`helix`, `helix-dark`, …), available to every client. **Protected.**
  Keep `themes/helix.yaml` in sync with `helixTokens` in `packages/ui/src/tokens.ts`.
- `clients/<id>/` — one folder per client, structured per the contract in
  `docs/reference/client-folder-contract.md`: `client.yaml`, `themes/` (YAML token sets),
  `pages/`, `components/`, `experiments/`, `data/` (mock fixtures), `docs/`, and
  `CLAUDE.md` (the client brief — **read it before any work for that client**).
  The filesystem is the registry: nothing is registered anywhere; files in the
  right place are discovered. YAML files are data only — never put logic there.

## Boundary rules (CI-enforced, do not work around)

1. `packages/ui` never imports from `clients/` or `app/`.
2. A client never imports from another client. To reuse something, copy it or
   propose promoting it to `@helix/ui`.
3. Client folders never import app internals — only `@helix/ui`.
4. Only `app/src/registry/` imports client code.

## Shared-kit mutation rule (critical)

Never modify `packages/ui` components to satisfy one client's need. Wrap or
override inside that client's folder instead (`clients/<id>/components/`).
Promotion of a component into the shared kit is a separate, deliberate PR that
the engineering owner reviews — never bundle it with client work.

Every kit component ships a `kitManifest` entry (id, description, demo) in
`packages/ui/src/gallery.tsx` — the kit galleries render the manifest, so a
component without an entry is invisible. Adding one without the other is an
incomplete change.

## Working on a client

- New pages go in `clients/<id>/pages/` (default export + colocated `meta` export);
  the route comes from the filename. No registration step exists.
- An experiment is a question; its variants are the competing answers:
  `experiments/<exp-id>/experiment.yaml` + `variants/<variant-id>/pages/`. A
  variant's pages override main pages by relative path — full files, never diffs.
  Experiments always have `variants/`, even with a single entry.
- Deciding an experiment is a merge: the chosen variant's pages are copied into
  main `pages/`, `experiment.yaml` records `chosen` + `rationale`, losers stay in
  git. `archived` closes an experiment without a decision. Both leave navigation.
- Mock data lives in `clients/<id>/data/` — typed, fictional, no real client data,
  no API calls.
- Component decision ladder (mirrors theme scoping): **search the kit first**
  — `kitManifest` in `packages/ui/src/gallery.tsx` is the catalog (browse at
  `/components`, which shows client → experiment-shared → kit in scope
  order) — then the client's `components/`. Reuse or wrap before creating.
  Create new components at the narrowest scope: beside a variant's pages
  while exploring, `experiments/<e>/shared/` when shared across variants,
  `clients/<id>/components/` when shared across experiments. Never copy
  between clients — flag `promoteCandidate` instead.
- Icons come from `@helix/ui/icons` (Lucide; browse/search at `/icons`) —
  never hand-draw SVGs for standard glyphs.
- Style only through tokens and Tailwind utilities backed by token variables
  (`bg-primary`, `border-border`, `rounded-(--radius)`, …). Hardcoded colors in
  client pages are a smell; adjust the client's theme YAML instead (token spec
  sheet at `/tokens`). The theme
  schema itself is core-owner territory — never extend it for one client.
- Themes are folder-scoped (see the contract): global `themes/`, client
  `themes/`, `experiments/<exp>/themes/`, `variants/<v>/themes/`. Put a theme at
  the narrowest scope that needs it — a rebrand exploration's theme belongs in
  its experiment folder, not the client's.
- Keep each client's `CLAUDE.md` brief current when scope or design decisions change.

## Skills

Use these for the recurring operations instead of improvising the file
structure (in `.claude/skills/`; they encode the contract — follow them
exactly):

- `/new-client`, `/new-theme`, `/new-experiment`, `/new-variant` — create
- `/theme-from-figma` — import a client's existing Figma DS as a theme
- `/import-from-code` — scaffold a flow from an existing app repo into a client
- `/decide-experiment` (graduation), `/archive-experiment` — close
- `/apply-feedback` — apply a `[playground-feedback v2]` batch from the
  inspect overlay (press `i` in the app, pin elements, "Copy for Claude")
- `/feedback-from-linear` — ingest Linear issues into a client's feedback threads
- `/promote-component` — client component → shared kit; core-owner PR
- `/handoff` — the engagement's exit package (drives `pnpm handoff`;
  judgment artifacts in the skill, mechanics in the script)

**Commit after every completed skill operation** — one operation, one
commit. Later operations depend on this history (the graduation drift check
reads it), and it keeps every step individually revertable.

## Commands

- `pnpm dev` — dev server on http://localhost:3003
- `pnpm run ci` — the full gate: lint, format check, boundaries, typecheck,
  build, scoped-build leak check. CI runs exactly this command; if it passes
  locally, CI passes.
- `pnpm ci:fix` — auto-fix (format + lint fixes) then run the full gate
- `pnpm format:dir <paths>` — scoped formatting (skills use this)
- `pnpm boundaries` / `pnpm promotion-candidates`
- `pnpm handoff <client>` — mechanical handoff artifacts (tokens,
  inventory, screens; needs the dev server)
- `pnpm a11y <client>` — on-demand WCAG 2.2 AA audit (axe-core, scores
  never block; needs the dev server)
- `pnpm build` — production build (`VITE_CLIENT=<id>` scopes to one client)

Husky hooks: pre-commit runs lint + format check + boundaries; pre-push
replays CI exactly — it checks out the pushed commit into a clean worktree,
does a frozen-lockfile install, and runs the full gate there. If pre-push
passes, CI passes; a pushed PR never needs a fix-up cycle. Never bypass
hooks — fix and recommit. PRs touching only `clients/**` merge on green
(enable GitHub auto-merge so green merges itself); anything touching `app/`,
`packages/`, or root config requires review (CODEOWNERS).

Lint enforces agent-sized modules: complexity ≤ 15, files ≤ 350 lines,
functions ≤ 200 lines, depth ≤ 4, params ≤ 5. When a limit fires, split the
module — never raise the limit for one file.

## Confidentiality

Never reference one client's name, brief, or work inside another client's folder,
nor inside `app/` or `packages/ui`. The core must stay client-agnostic.
