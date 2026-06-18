---
name: theme-from-figma
description: Create a theme from a client's existing Figma design system — via the Figma MCP, a DTCG/variables export, or reference screenshots. Use when a client arrives with a Figma file, brand library, or exported design tokens.
---

# Theme from Figma

Turn a client's existing Figma design system into a playground theme at
the right scope. Mechanics live in `pnpm dtcg-to-theme <tokens.json>`
(DTCG document → theme YAML, Design-standard fallbacks flagged with
`# review:` comments); this skill owns acquiring the tokens and every
mapping judgment.

## Steps

1. Read the client's `CLAUDE.md` brief, and the theme-scoping ladder in
   `docs/reference/client-folder-contract.md` — a rebrand exploration's theme
   belongs in its experiment folder, not the client's `themes/`.
2. Acquire the tokens, best source first:
   - **Figma MCP connected** — read the file's variables and styles
     directly; shape them into the DTCG profile the converter expects
     (`color`, `font`, `typeScale`, `spacing`, `radius`, `shadow` groups).
   - **An export exists** — Figma's native variables export and Tokens
     Studio both emit DTCG or near-DTCG JSON; massage group names into
     the profile, then run the converter.
   - **Neither** — work from brand screenshots/guidelines by eye: exact
     hex values where stated, judgment elsewhere, every judged value
     flagged with a `# review:` comment.
3. Map with the schema as the boundary, not the Figma file: the theme
   schema is core-owned and never grows for an import. Figma concepts
   with no token slot (per-component styles, grids, effects beyond
   shadows) are noted in the theme's header comment as not carried over —
   never invented as extra keys.
4. Multi-mode files (light/dark, brand A/B): each mode becomes its own
   theme file; name them for what they are (`default`, `dark`, …) and set
   `client.yaml`'s `defaultTheme` to the client's primary mode.
5. Fonts: the canvas can only render fonts the app loads. If the Figma
   file uses a webfont we don't bundle, keep it first in the stack with a
   system fallback and flag it — adding a `@fontsource` package is a
   core change for the owner, never done inside client work.
6. Validate: dev server up, open `/c/<id>/tokens` and the components
   gallery under the new theme, confirm no error card and that the brand
   reads right. Fix `# review:` items you can verify; leave the rest for
   the user.
7. Gate (`pnpm lint && pnpm format:dir clients/<id> && pnpm typecheck &&
pnpm boundaries`), one commit: `New theme from Figma: <client>/<theme>`.

## Rules

- Never write outside `clients/<id>/` (the converter's Design-standard
  fallbacks come from reading `themes/design.yaml`, not editing it).
- The schema is the contract: anything that doesn't fit is flagged and
  dropped, not squeezed in.
- Hex values from Figma are authoritative — never "improve" the client's
  brand colors during import.
