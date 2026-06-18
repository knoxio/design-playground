# Skill registry

The recurring playground operations, one per skill in `.claude/skills/`. A
skill is Markdown instructions Claude executes; some drive a deterministic
script in `scripts/`. The skill owns judgment, the script owns mechanics.

Every skill carries the same invariants from the root `CLAUDE.md` and the
[folder contract](./client-folder-contract.md): client skills never write
outside `clients/<id>/`, every operation is one commit, and the boundary
rules ([ADR 0003](../adr/0003-module-boundary-rules.md)) and shared-kit
mutation rule ([ADR 0004](../adr/0004-shared-kit-mutation-rule.md)) hold
throughout.

## Overview

| Skill                   | Purpose                                      | Script              | PRD                                             | Key ADRs         |
| ----------------------- | -------------------------------------------- | ------------------- | ----------------------------------------------- | ---------------- |
| `new-client`            | Scaffold a client folder                     | —                   | [01](../prds/prd-01-client-lifecycle.md)        | 0001, 0002, 0014 |
| `brief-from-transcript` | Turn a meeting transcript into brief + PRD   | —                   | [03](../prds/prd-03-transcript-brief.md)        | 0014             |
| `new-theme`             | Create/fork a theme at the right scope       | —                   | [02](../prds/prd-02-design-system-theming.md)   | 0004, 0005       |
| `theme-from-figma`      | Import a Figma DS as a theme                 | `dtcg-to-theme.mjs` | [02](../prds/prd-02-design-system-theming.md)   | 0005             |
| `new-experiment`        | Start an experiment with variants            | —                   | [04](../prds/prd-04-prototyping-experiments.md) | 0006, 0012       |
| `new-variant`           | Add a variant to an active experiment        | —                   | [04](../prds/prd-04-prototyping-experiments.md) | 0006, 0012       |
| `decide-experiment`     | Graduate the chosen variant into Main        | —                   | [04](../prds/prd-04-prototyping-experiments.md) | 0006, 0012       |
| `archive-experiment`    | Close an experiment without a decision       | —                   | [04](../prds/prd-04-prototyping-experiments.md) | 0006, 0012       |
| `apply-feedback`        | Turn open comment threads into source edits  | `feedback-mcp.mjs`  | [05](../prds/prd-05-overlay-feedback.md)        | 0017, 0013       |
| `handoff`               | Produce the engagement exit package          | `handoff.mjs`       | [07](../prds/prd-07-handoff.md)                 | 0009             |
| `promote-component`     | Promote a client component into `@design/ui` | —                   | [04](../prds/prd-04-prototyping-experiments.md) | 0003, 0004       |
| `import-from-code`      | Scaffold a flow from an existing app repo    | —                   | [11](../prds/prd-11-import-from-code.md)        | 0003, 0004, 0002 |
| `feedback-from-linear`  | Ingest Linear issues into feedback threads   | —                   | [12](../prds/prd-12-linear-integration.md)      | 0017, 0008       |

Scripts run standalone without a session: `pnpm handoff <id>`,
`pnpm a11y <id>`, `pnpm dtcg-to-theme <file>`. The feedback MCP server
(`feedback-mcp.mjs`) backs `apply-feedback` and is registered in `.mcp.json`.

---

## new-client

Scaffold `clients/<id>/` exactly per the folder contract.

- **Trigger:** create / add / onboard a new client.
- **Inputs:** `id` (kebab-case, unique), `name`, optional source client whose
  default theme is copied (default: global `themes/design.yaml`).
- **Does:** writes `client.yaml`, `themes/default.yaml`, the `CLAUDE.md` brief
  template, a minimal `pages/home.tsx`, and the empty `components/`, `data/`,
  `docs/` dirs (`.gitkeep`). Runs the client gate, then commits.
- **Script:** none — pure file scaffold.
- **PRD:** [01 — client lifecycle](../prds/prd-01-client-lifecycle.md).
- **Honors:** the filesystem-is-the-registry rule ([ADR 0002](../adr/0002-filesystem-is-the-registry.md)) — no registration step; one-app-as-folders ([ADR 0001](../adr/0001-one-app-clients-as-folders.md)); Claude-only authoring ([ADR 0014](../adr/0014-claude-only-authoring.md)). Never touches `app/`, `packages/`, or root config.

## brief-from-transcript

Distill a meeting transcript into the client brief and a PRD skeleton, or
update them after a follow-up meeting.

- **Trigger:** after a kickoff, review call, or any meeting that changes scope.
- **Inputs:** existing `client id`, the `transcript` (path or pasted), meeting
  date/type/attendees.
- **Does:** writes `clients/<id>/CLAUDE.md` (fixed sections) and
  `clients/<id>/docs/prd.md` (one section per feature, tagged
  `[confirmed]`/`[assumed]`/`[open]`/`[rejected]`). Update mode appends and
  flips tags, never rewrites confirmed scope.
- **Script:** none.
- **PRD:** [03 — transcript to brief](../prds/prd-03-transcript-brief.md).
- **Honors:** the traceability rule (every claim traces to the transcript or
  carries `[assumed]`) and Claude-only authoring ([ADR 0014](../adr/0014-claude-only-authoring.md)). The transcript itself is not committed unless asked.

## new-theme

Create a theme YAML at the correct scope.

- **Trigger:** design a client design system, fork a theme, try a brand
  direction, add a dark mode.
- **Inputs:** `target` (client + scope), `theme id`, `source` theme to fork,
  brand `direction`.
- **Does:** copies the source YAML to the target path, adjusts to the
  direction, annotates choices. Scoped format, then commit.
- **Script:** none.
- **PRD:** [02 — design system & theming](../prds/prd-02-design-system-theming.md).
- **Honors:** folder-scoped themes — narrowest scope wins ([ADR 0005](../adr/0005-folder-scoped-themes.md)); the theme schema (`packages/ui/src/tokens.ts`) is core-owned and never extended for one client ([ADR 0004](../adr/0004-shared-kit-mutation-rule.md)). Global `themes/` requires a separate owner-reviewed PR.

## theme-from-figma

Turn a client's existing Figma design system into a theme.

- **Trigger:** a client arrives with a Figma file, brand library, or token
  export.
- **Inputs:** the client; tokens via Figma MCP, a DTCG/variables export, or
  reference screenshots.
- **Does:** acquires tokens (best source first), shapes them into the DTCG
  profile, runs the converter, maps with the schema as the boundary.
- **Script:** `scripts/dtcg-to-theme.mjs` (`pnpm dtcg-to-theme <tokens.json>`)
  — DTCG document → theme YAML, missing groups falling back to the Design
  standard with `# review:` comments. Reverse of the handoff token export.
- **PRD:** [02 — design system & theming](../prds/prd-02-design-system-theming.md).
- **Honors:** folder-scoped themes ([ADR 0005](../adr/0005-folder-scoped-themes.md)); the schema is the contract — Figma concepts with no token slot are flagged and dropped, never invented as keys; hex values from the brand are authoritative.

## new-experiment

Create an experiment with one or more variants.

- **Trigger:** explore competing design directions, try a variant of a flow.
- **Inputs:** `client`, `experiment id` (named for the question, not a
  solution), `name + question`, `variants` (default `v1`; neutral codenames
  for contested directions), optional `seed pages`.
- **Does:** writes `experiment.yaml` (`status: active`), creates
  `variants/<v>/pages/`, fixes relative imports on seeded pages, then
  differentiates each seeded variant toward its direction.
- **Script:** none.
- **PRD:** [04 — prototyping & experiments](../prds/prd-04-prototyping-experiments.md).
- **Honors:** experiments/variants/graduation ([ADR 0006](../adr/0006-experiments-variants-graduation.md)); at most one experiment per lineage ([ADR 0012](../adr/0012-one-experiment-per-lineage.md)). Same-filename page = override; new filename = variant-only addition; never a page list in YAML.

## new-variant

Add a variant to an existing active experiment.

- **Trigger:** a new direction emerges mid-experiment.
- **Inputs:** `client`, `experiment` (must be `active`), `variant id` +
  display name, `source` (`fork <sibling>`, `seed <main-page>...`, or `empty`).
- **Does:** creates `variants/<id>/pages/` from the source, adds the display
  name to `experiment.yaml`, differentiates a fork immediately.
- **Script:** none.
- **PRD:** [04 — prototyping & experiments](../prds/prd-04-prototyping-experiments.md).
- **Honors:** [ADR 0006](../adr/0006-experiments-variants-graduation.md), [ADR 0012](../adr/0012-one-experiment-per-lineage.md). Decided/archived experiments do not grow variants — start a new experiment instead.

## decide-experiment

Graduate the chosen variant into the client's Main pages.

- **Trigger:** a client or Mary picks a winning variant.
- **Inputs:** `client`, `experiment`, `winning variant`, one-line `rationale`.
- **Does:** runs the drift check (does Main differ from the variant fork
  point?), copies the variant's pages into Main, fixes imports (four dirs up),
  promotes any experiment-scoped theme to client scope, sets
  `experiment.yaml` to `status: decided` with `chosen`/`decided`/`rationale`,
  appends the Decision log, runs the full client gate + `pnpm build`, commits.
- **Script:** none. The drift check reads git history — relies on each prior
  operation having been committed.
- **PRD:** [04 — prototyping & experiments](../prds/prd-04-prototyping-experiments.md).
- **Honors:** graduation-is-a-merge, not a flag ([ADR 0006](../adr/0006-experiments-variants-graduation.md)); Main must never import from an experiment folder ([ADR 0003](../adr/0003-module-boundary-rules.md)). Losing variants stay in git, untouched.

## archive-experiment

Close an experiment without a decision.

- **Trigger:** an exploration is abandoned, parked, or superseded.
- **Inputs:** `client`, `experiment`, one-line `why`.
- **Does:** sets `experiment.yaml` `status: archived`, appends the Decision
  log, commits. Touches nothing else; deletes nothing.
- **Script:** none.
- **PRD:** [04 — prototyping & experiments](../prds/prd-04-prototyping-experiments.md).
- **Honors:** [ADR 0006](../adr/0006-experiments-variants-graduation.md). If the user is actually choosing a winner, redirect to `decide-experiment`.

## apply-feedback

Turn open comment threads into source edits and write resolutions back.

- **Trigger:** asked to apply/handle comments for a client, or given a
  `[playground-feedback]` payload from the overlay's "Copy for Claude".
- **Inputs:** client; threads via the `design-feedback` MCP server, a pasted
  payload, or curl with the `.env` service token.
- **Does:** reads each thread's anchor (source / selector / token / kit /
  page), applies the fix at the anchored site, pushes back on wrong requests,
  runs the client gate, commits one batch per client, then writes every
  resolution back (`reply_to_thread` + `set_thread_status`).
- **Script:** `scripts/feedback-mcp.mjs` — MCP server over the feedback API
  (`list_threads`, `reply_to_thread`, `set_thread_status`), authenticated with
  the Access service token from `.env`. Registered in `.mcp.json`.
- **PRD:** [05 — overlay & feedback](../prds/prd-05-overlay-feedback.md).
- **Honors:** the feedback engine is the Claude session, not a separate app
  ([ADR 0017](../adr/0017-feedback-engine-is-claude-session.md)); the canonical addressing scheme for anchors ([ADR 0013](../adr/0013-canonical-addressing-scheme.md)); the kit-mutation rule (kit defects are flagged, not patched per client) and tokens-over-hardcoded-values.

## handoff

Produce the engagement's exit package — what engineers build the real product
from.

- **Trigger:** an engagement ends, or a handoff/addendum is requested.
- **Inputs:** the client; `--addendum <experiment>` for support-period deltas.
- **Does:** blocks on unresolved PRD items and active experiments, runs the
  script, writes the finalized `handoff/prd.md`, reviews `real-vs-mocked.md`,
  sanity-checks `components.md` against the rendered app, gates, commits.
- **Script:** `scripts/handoff.mjs` (`pnpm handoff <id>`) — writes
  `tokens.json` (W3C DTCG), `components.md` (import-based inventory),
  the `real-vs-mocked.md` skeleton, and chrome-less `screens/` of every Main
  page via the `/frame/...` route. Screens need the dev server on `:3003`.
- **PRD:** [07 — handoff](../prds/prd-07-handoff.md).
- **Honors:** the package is self-contained reference, never shipped; exports
  Main only (experiments excluded, hence the block-on-active step); real
  client data never appears. `handoff/` is hand-editable only during a run.
  Validated by the testing layers ([ADR 0009](../adr/0009-automated-testing-layers.md)).

## promote-component

Promote a client component into the shared kit (`@design/ui`).

- **Trigger:** a `promoteCandidate` (from `pnpm promotion-candidates`) is
  approved for the kit.
- **Inputs:** `client` + `component`, the generalized `kit name`.
- **Does:** generalizes (strips client types/vocabulary, token-only styling),
  creates `packages/ui/src/components/<KitName>.tsx`, exports it, adds the
  `kitManifest` entry in `gallery.tsx`, rewrites the origin component as a thin
  wrapper, clears its flag, runs the full suite incl. `pnpm build`.
- **Script:** none. `pnpm promotion-candidates` lists the queue.
- **PRD:** [04 — prototyping & experiments](../prds/prd-04-prototyping-experiments.md) (the promotion path).
- **Honors:** the shared-kit mutation rule — promotion is its own owner-reviewed PR, never bundled with client work ([ADR 0004](../adr/0004-shared-kit-mutation-rule.md)); kit never imports from `clients/` ([ADR 0003](../adr/0003-module-boundary-rules.md)); a kit component without a `kitManifest` entry is invisible, so the entry is mandatory.

## import-from-code

Scaffold a client's pages, mock data, and components from an existing app repo.

- **Trigger:** a client already has a running app and you want a prototype of one
  of its flows in the playground.
- **Inputs:** `source` (repo path/URL), `client` (must exist), the `flow`/screens
  to import.
- **Does:** reads the source for the flow's screens, order, data, and components;
  writes contract-valid pages (files or flow folders), typed **fictional** mock
  data, and client components built on `@design/ui` — never copying real data or
  editing the kit. Runs the full gate, commits; the diff touches only the client.
- **Script:** none — judgment-heavy translation, not a deterministic transform.
- **PRD:** [11 — import from code](../prds/prd-11-import-from-code.md).
- **Honors:** the boundary rules ([ADR 0003](../adr/0003-module-boundary-rules.md)),
  the shared-kit mutation rule ([ADR 0004](../adr/0004-shared-kit-mutation-rule.md)),
  filesystem-is-the-registry ([ADR 0002](../adr/0002-filesystem-is-the-registry.md)),
  and fictional-data-only. Import is one-directional.

## feedback-from-linear

Ingest Linear issues into a client's feedback threads, optionally posting preview
URLs back.

- **Trigger:** a client's feedback lives in Linear and you want it on the
  playground feedback service without manual copy-paste.
- **Inputs:** `client`, a Linear `scope` (project / label / filter / issue ids),
  optional `post-back`.
- **Does:** reads issues via the Linear MCP, creates/updates one thread per issue
  (`POST $DP_FEEDBACK_URL/threads`), dedupes by recorded Linear issue id, lands a
  screen-referencing issue on its route, surfaces a design-question issue as an
  experiment candidate; with post-back, writes the preview URL onto the issue.
- **Script:** none — reuses the Linear MCP and the feedback service.
- **PRD:** [12 — Linear integration](../prds/prd-12-linear-integration.md).
- **Honors:** the feedback engine is the Claude session
  ([ADR 0017](../adr/0017-feedback-engine-is-claude-session.md)) and access-based
  confidentiality ([ADR 0008](../adr/0008-access-based-confidentiality.md)) — a
  preview URL is only posted to a workspace authorized for that client.

---

## Justification audit

Every skill maps to a PRD and at least one ADR above. One thinness to note:

- **`promote-component`** is governed by [PRD-04](../prds/prd-04-prototyping-experiments.md)
  (the promotion path / C10) and anchored in
  [ADR 0004](../adr/0004-shared-kit-mutation-rule.md) and
  [ADR 0003](../adr/0003-module-boundary-rules.md). The mechanics — the
  `promoteCandidate` queue, the cross-client near-duplicate scan, the
  owner-review gate — are only lightly specified there; expand PRD-04's
  promotion section if the workflow grows.

All other skills have both a PRD and governing ADRs.
