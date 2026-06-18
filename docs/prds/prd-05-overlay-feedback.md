# PRD-05 — Overlay & feedback loop

**Status:** Built
**Owns:** C13 (overlay + apply loop), C16 (comment thread service)
**Depends on:** PRD-06 (scoped builds) and PRD-08 (deployments) for commenting on previews; the internal loop needs neither
**Governing ADRs:** [0017-feedback-engine-is-claude-session](../adr/0017-feedback-engine-is-claude-session.md), [0008-access-based-confidentiality](../adr/0008-access-based-confidentiality.md), [0004-shared-kit-mutation-rule](../adr/0004-shared-kit-mutation-rule.md), [0016-cloudflare-stack](../adr/0016-cloudflare-stack.md)

## Problem

Mary's loop is "look at the rendered prototype, tell Claude what to change"; the
client's is "look at the preview, tell Mary." Both need pointing-at-things to
survive the trip: precise enough for Claude to edit the right source, durable
enough that a Tuesday comment still exists Thursday, and threaded so a comment is
a conversation, not a sticky note.

## Design

The engine is Mary's interactive Claude Code session — subscription-priced, no
API key, nothing in the loop metered (ADR
[0017](../adr/0017-feedback-engine-is-claude-session.md)). The overlay captures
intent, a small Cloudflare service persists it, and `/apply-feedback` consumes
it.

### One overlay, every surface

The same Figma-style overlay runs on every surface, identical for designer and
client:

- Toggled by the dock button or `i` internally, by the PROTOTYPE banner button
  on previews. Hover highlights the best anchor; click → note box → a thread,
  pinned as a status-colored dot. A panel button comments on the whole page.
- Anchor precision degrades by surface:

  | Kind       | Source                                          | Where                    |
  | ---------- | ----------------------------------------------- | ------------------------ |
  | `source`   | `data-hx-source` file:line (compile-time stamp) | internal builds only     |
  | `token`    | `colors.primary`, etc.                          | `/tokens` rows           |
  | `kit`      | component id                                    | `/components` demos      |
  | `selector` | CSS selector + text excerpt                     | anywhere else (previews) |
  | `page`     | the route as a whole                            | whole-page comments      |

- Context per thread: client, route, theme key, viewport. The `[data-hx-ui]`
  exclusion keeps the chrome from ever becoming a comment target.
- The panel lists the current page's threads (or all of the client's), replies
  inline, with status controls internal-only.

### Source mapping (internal builds only)

A compile-time Vite/Babel transform stamps DOM elements with `data-hx-source`
(file:line, component name) — compile-time, not React internals (React 19
removed `_debugSource`). Provably absent from `VITE_CLIENT` preview builds
(PRD-06's leak grep covers it).

### Feedback service — Pages Functions + D1

One Worker (`functions/api/[[path]].ts`) over a shared D1 database, served
same-origin as `/api/*` inside every deployed surface:

- Schema: `threads(id, client, route, theme_key, anchor_kind
source|token|kit|selector|page, anchor json, status
open|applied|rejected|outdated, created_by, created_at, viewport, resolved_by,
resolved_at)` and `messages(id, thread_id, author, body, created_at)`.
- **Threads, not flat comments** — replies attach to the thread; resolution is a
  thread-level status.
- **Auth (ADR [0008](../adr/0008-access-based-confidentiality.md)):** each
  surface's own Cloudflare Access app gates its `/api/*`, so author identity is
  the Access email for free and the server ignores self-declared names where one
  exists. Automation and the local dev proxy use an Access service token from a
  gitignored `.env`; a local user without identity supplies a display name once.
  No anonymous reads or writes. Per-surface scoping means a preview's Worker only
  ever serves that client's threads.
- Free tier is the budget — the service fits D1/Workers free limits at agency
  scale by orders of magnitude.

### `hx-feedback` MCP server

`.mcp.json` registers a stdio server (`scripts/feedback-mcp.mjs`, `.env` service
token) exposing the same threads as structured tools: `list_threads`,
`reply_to_thread`, `set_thread_status`. Sessions read comment details natively;
`/apply-feedback` prefers it over curl and payload parsing.

### `/apply-feedback` skill

Fetches open threads for the client (MCP first; a pasted `[playground-feedback
v3]` payload or curl with the `.env` token as fallbacks). Applies each at exactly
the anchored site with the kit-mutation rule respected (kit-wants-changing →
wrap in the client folder + promotion candidate), one commit per batch.
Resolves threads: `applied` on success, `rejected`/`outdated` with a reply the
commenter sees. Selector-anchored preview threads are resolved to source by the
skill from the route and text excerpt. After merge to main, deploys update
automatically (PRD-08) — the loop closes without Mary touching anything but her
session.

### Export payload

"Copy for Claude" exports stored threads (this page or all open) as the
`[playground-feedback v3]` block with thread ids included, so resolutions write
back precisely — the offline path beside the MCP server.

### Surface differences

- Preview builds carry no source stamps (PRD-06 grep proves it) and no status
  controls or export button — clients create, reply, and see resolutions;
  moderation is Helix-only, enforced server-side either way.
- Public (`public: true`) previews have no Access identity, so commenting is
  disabled there entirely — no anonymous reads or writes.

## Behavior / acceptance

1. Comment on the demo client → `/apply-feedback` in a fresh session makes the
   right edit, commits, and flips the thread to `applied` with a reply — via MCP,
   no clipboard.
2. The same flow works via a pasted v3 payload with the service unreachable.
3. A selector-anchored thread (a client preview capture) is resolved to source
   and applied.
4. A client reply on a rejected thread appears in Mary's panel.
5. A preview build contains no `data-hx-source`; comments work behind Access with
   no status controls exposed to clients.

## Non-goals

- Embedded Agent-SDK session in the page (rejected for cost — ADR
  [0017](../adr/0017-feedback-engine-is-claude-session.md)); realtime
  presence/cursors; email notifications; screenshots in payloads.
