---
name: new-theme
description: Create or fork a theme at the correct scope (client, experiment, or variant). Use when asked to create a design system for a client, fork a theme, try a brand direction, or add a dark mode.
---

# New theme

Create a theme YAML at the right scope, per the contract's theme rules
(`docs/reference/client-folder-contract.md`).

## Inputs

- **target** (required): client id + scope. **Narrowest-scope rule:** a
  brand exploration for one experiment goes in
  `experiments/<e>/themes/`, one variant's direction in
  `variants/<v>/themes/`, the client's real direction in the client's
  `themes/`. Global `themes/` is core-owner territory — if asked to add a
  global theme, say it needs Joao's review and put it in its own PR.
- **theme id** (required): kebab-case filename.
- **source** (required): any existing theme to fork — global `helix` /
  `helix-dark`, another of this client's themes, or another client's theme
  (copying a theme file across clients is allowed; it's data, not code).
- **direction**: the brief's brand adjectives ("warmer, rounder, navy
  primary, tabular numbers").

## Steps

1. Read the client's `CLAUDE.md` brief — brand adjectives and vocabulary
   live there. The theme schema is in `packages/ui/src/tokens.ts`
   (`themeSchema`); never extend the schema itself for one client.
2. Copy the source YAML to the target path and adjust per the direction.
   Annotate choices with comments (`# navy, from their brand PDF`) — theme
   files should explain themselves.
3. Mind the schema's intent: `density` is the spacing feel
   (compact/regular/spacious), `numbers: tabular` whenever money or IDs
   appear in tables, `primary-foreground` must actually contrast with
   `primary` (dark text on bright greens, not white).
4. If this should be the default while viewing an experiment, set
   `theme: <id>` in that experiment's `experiment.yaml`.
5. Run `pnpm format:dir clients/<client>` (scoped — repo-wide format writes outside the client folder). If a dev server is available, verify: the theme
   appears in the dock picker at its scope (galleries show all scopes), no
   error card on the overview or sidebar; flip to it on the kit gallery to
   judge it. Commit.

## Rules

- YAML is data: no logic, no imports, valid YAML (quote font stacks —
  `sans: '"DM Sans Variable", system-ui, sans-serif'`).
- Never write outside the target client folder (global themes excepted, per
  the review rule above).
