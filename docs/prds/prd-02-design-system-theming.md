# PRD-02 — Design system & theming

**Status:** Built
**Owns:** C5 (theme schema), C6 (token & component galleries), C7 (live styleset swap)
**Depends on:** PRD-01 (theme discovery), [client folder contract](../reference/client-folder-contract.md)
**Governing ADRs:** [0005-folder-scoped-themes](../adr/0005-folder-scoped-themes.md), [0004-shared-kit-mutation-rule](../adr/0004-shared-kit-mutation-rule.md), [0003-module-boundary-rules](../adr/0003-module-boundary-rules.md)

## Problem

A flat token set (colors plus radius plus one font) separates themes, not
brands — it cannot express "dense, utilitarian, tabular numbers" against a
generous consumer brand. A design system also has to be judgeable on its own:
without a gallery Mary evaluates tokens against whatever page happens to exist,
and two brand directions need to be compared live in the first meeting.

## Design

### Theme schema

A theme is one YAML in a `themes/` folder (id = filename, default named by
`client.yaml`, comments encouraged). The schema is owned here and validated with
zod; the parsed-theme type lives in `@helix/ui` alongside it:

| Group   | Contents                                                                                                  |
| ------- | --------------------------------------------------------------------------------------------------------- |
| Colors  | base palette plus `surface` and `ring` (focus)                                                            |
| Type    | font families (sans, mono), a type scale (`xs`–`3xl` with line heights), tabular vs proportional numerics |
| Density | `compact \| regular \| spacious` — a scalar over the base spacing scale (an enum, not a free number)      |
| Radii   | `sm` / `md` / `lg`                                                                                        |
| Shadows | `sm` / `md` / `lg` strings                                                                                |

The loader maps a parsed theme to a scoped CSS-variable block (`tokensToStyle`)
applied to the prototype canvas element only — client themes never touch
`:root`. The chrome (shell, dock, overview) keeps the static Helix defaults and
is never themed by a client: what looks like the client's product is exactly the
canvas, nothing else. Tailwind theme variables reference the same custom
properties, so utility classes work unchanged.

The schema is core-owner territory. A schema change is a breaking change to
every theme YAML on disk; it is never extended for one client's import (ADR
[0005](../adr/0005-folder-scoped-themes.md)).

### Folder-scoped themes

A `themes/` folder may exist at four layers; a theme is exposed only within its
layer's scope:

| Layer      | Location                    | Exposed                            |
| ---------- | --------------------------- | ---------------------------------- |
| Global     | repo-root `themes/`         | every client                       |
| Client     | `clients/<id>/themes/`      | everywhere in that client          |
| Experiment | `experiments/<exp>/themes/` | only while viewing that experiment |
| Variant    | `.../variants/<v>/themes/`  | only while viewing that variant    |

`resolveTheme` precedence is variant → experiment → client → global. A rebrand
experiment carries its own theme without polluting the client's theme list; when
the experiment is archived, its theme goes with it. `client.yaml`'s
`defaultTheme` names a client-scope or global theme; `experiment.yaml`'s optional
`theme:` applies as the scoped default while viewing that experiment.

### Token & component galleries

- **Kit manifest:** `@helix/ui` exports `kitManifest`
  (`packages/ui/src/gallery.tsx`) — one entry per kit component (id,
  description, zero-prop demo). Galleries iterate the manifest, so a component
  without an entry is structurally invisible: adding a kit component requires
  adding its demo in the same PR.
- `/tokens` is the foundations spec sheet (colors, type, spacing, radii, shadows
  — values shown and copyable). `/components` is the single component surface,
  scope-ordered client → experiment-shared → kit. Both exist per client and
  globally, linked from the sidebar and overview.
- Gallery pages live in `app/` and import no client code; themes arrive through
  the normal theme mechanism.

### Live styleset swap

- A switcher on the dock (internal builds only) lists the current scope chain,
  grouped by layer, global themes last. Switching applies instantly via the
  scoped canvas variables — no reload, no persistence; it resets on load like
  the viewport override (PRD-09).
- On the kit and components galleries the switcher instead exposes the client's
  full theme inventory across scopes (active experiments and variants included,
  owner-labeled, e.g. "electric · Rebrand") so any theme can be judged against
  the kit without visiting its scope.
- An experiment's `theme:` applies as the scoped default while viewing it; a
  session override from the switcher wins until the user leaves the scope that
  owns the selected theme.
- Stripped from client-facing preview builds (PRD-06).

### Figma import

`/theme-from-figma` turns a client's existing Figma design system into a theme
at the correct scope — via the Figma MCP, a DTCG / variables export, or
reference screenshots. The mechanics live in `pnpm dtcg-to-theme <tokens.json>`
(DTCG document → theme YAML, Helix-standard fallbacks flagged with `# review:`
comments); the skill owns acquiring the tokens and every mapping judgment. The
schema is the boundary, not the Figma file: Figma concepts with no token slot
(per-component styles, grids, effects beyond shadows) are noted in the theme's
header comment, never invented as extra keys.

**Figma import validation.** `scripts/dtcg-to-theme.mjs` exposes a pure
`dtcgToTheme(doc, fallback)` covered by `scripts/dtcg-to-theme.test.mjs` (in the
`ci` gate): a DTCG document converts to a theme that passes `themeSchema`, and
any omitted group falls back to the Helix standard with a review warning — never
silently invented. The live Figma MCP acquisition path remains judgment the
skill owns; the deterministic converter no longer ships untested.

## Behavior / acceptance

1. A "dense, utilitarian, navy/amber, tabular numbers" theme is expressible in
   one YAML with no component edits.
2. The kit gallery renders the full kit under any client's theme.
3. Theme swap on the gallery is instant and side-effect-free; the dock switcher
   lists exactly the current scope chain plus the global themes.
4. A theme YAML with an invalid color degrades to the standard error card.
5. Boundary check green — the gallery imports no client code.

## Non-goals

- DTCG as the authoring format — the YAML stays the source of truth
  (commentable, constrained for agent editing); handoff exports DTCG (PRD-07).
  No Style Dictionary pipeline in the playground.
- Dark mode as a special case — it is a theme file like any other.
- Per-component theming beyond tokens.
