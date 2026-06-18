# Glossary

The vocabulary of the playground. Terms are used precisely throughout the docs
and skills.

- **Playground** — the Vite + React app in this repo. Thin tooling around Claude
  Code; not the product that ships to a client.
- **Client** — one engagement, stored as a folder `clients/<id>/`. The folder id
  is the client id; there is no separate identifier.
- **Main** — a client's canonical prototype: the contents of its `pages/` with
  no experiment overlaid. What demos default to and what handoff exports.
- **Page** — one screen of a prototype. A page is either a single file
  (`pages/dashboard.tsx`) or a folder (a flow). Discovered from the filesystem;
  the filename is the route segment.
- **Flow** — a page realized as an ordered sequence of step screens, authored as
  a folder of step files. A flow is at most one level deep.
- **Step** — one screen within a flow; a page in its own right, individually
  addressable.
- **State** — a named condition of a screen (empty, loading, error, modal-open,
  …), authored as a colocated `states` export. The default render is the
  implicit default state.
- **Experiment** — a question about a design ("dense form, or guided wizard?"),
  stored as `experiments/<id>/` with an `experiment.yaml`.
- **Variant** — a competing answer within an experiment, stored as
  `variants/<id>/pages/`. A variant page overrides a Main page of the same name,
  adds a page with no Main counterpart, or falls through to Main unchanged.
- **Graduation (decide)** — resolving an experiment by merging the chosen
  variant's pages into Main and recording `chosen` + `rationale`. A merge, not a
  flag.
- **Archive** — closing an experiment without a decision; nothing merges.
- **Scope (theme)** — the layer a theme is exposed at: global, client,
  experiment, or variant. A theme is visible only within its scope chain.
- **Theme** — a complete token set (colors, type, density, radii, shadows)
  authored as one YAML file and applied as scoped CSS variables.
- **Token** — a single design value in a theme (e.g. `colors.primary`). Browsed
  on the `/tokens` gallery.
- **Kit** — `@design/ui`, the shared, client-agnostic, token-driven component
  library. Browsed on the `/components` gallery; cataloged by `kitManifest`.
- **Promotion** — moving a client component into the shared kit, via a separate
  core-reviewed PR. Candidates are flagged with `promoteCandidate`.
- **Overlay** — the Figma-style commenting layer on every surface (press `i`
  internally; a toggle on previews). Anchors a comment to an element, token,
  kit demo, or the whole page.
- **Thread** — one comment conversation, anchored to a spot, with a status
  (`open | applied | rejected | outdated`). Stored in the feedback service.
- **Anchor** — what a thread points at: a source stamp, a token, a kit demo, or
  a selector + text excerpt.
- **Scoped preview** — a per-client build that physically contains only that
  client's folder, deployed as its own gated surface for client review.
- **Main app / internal app** — the full, unscoped build with every client and
  every tool, behind Access for the team.
- **Brief** — `clients/<id>/CLAUDE.md`: who the client is, the problem, agreed
  scope, vocabulary, brand. Generated from a meeting transcript; read before any
  work for that client.
- **Handoff** — the engagement's exit package: finalized PRD, exported tokens,
  component inventory, real-vs-mocked declaration, and screenshots.
- **Real vs mocked** — the standing handoff declaration of what in the prototype
  is illusion (mock data, no auth, no real latency).
- **The gate** — `pnpm run ci`: the single quality command run locally, in the
  pre-push hook, and in CI.
- **Skill** — a pre-built Claude Code operation in `.claude/skills/` (new
  client, new experiment, decide, apply feedback, …). Cataloged in
  `../reference/skills.md`.
- **Capability** — a user-facing ability the playground provides; tracked with
  its build status in `../roadmap.md`.
