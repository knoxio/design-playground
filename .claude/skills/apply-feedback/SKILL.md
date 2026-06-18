---
name: apply-feedback
description: Apply feedback comment threads to client source. Use when asked to apply/handle comments or feedback for a client, or when given a [playground-feedback] payload from the overlay's Copy for Claude.
---

# Apply feedback

Feedback is comment threads in the feedback service — created by anyone,
on any surface, targeted at an element or a whole page. This skill turns
open threads into source edits and writes the resolution back where the
commenter sees it.

Two ways the same data reaches you:

- **MCP (preferred)** — the `hx-feedback` server (`.mcp.json`) exposes
  `list_threads`, `reply_to_thread`, `set_thread_status`. Use
  `list_threads` with `status: "open"` for the client you're working on.
- **Pasted payload** — a `[playground-feedback v3]` block from the
  overlay's "Copy for Claude" (an export of the same threads, ids
  included). Older v1/v2 payloads from before the unification carry no
  thread ids — apply them the same way, but note in your summary that
  statuses could not be written back.

If MCP tools are unavailable and nothing was pasted, fall back to curl with
the `.env` service token (see `.env.example`):
`GET $HX_FEEDBACK_URL/threads?client=<id>&status=open` plus the
matching `POST …/messages` and `PATCH …/<id>` calls.

## Reading a thread

Every thread carries `route`, `theme_key`, `viewport`, an anchor, and its
`messages` (first message = the request; later ones are discussion — read
them all, the latest reply may supersede the original ask). Anchor kinds:

- **source** (`{source: "file:line", tag, text}`) — internal captures.
  Open the file, locate by line, confirm by tag/text. Drifted → find by
  text; unfindable → `outdated`.
- **selector** (`{selector, text}`) — client captures on previews (no
  source stamps there). Resolve to source yourself: the route names the
  page file (variant routes name the variant's file), the text excerpt
  locates the element. Not confidently resolvable → `outdated`.
- **token** (`{token: "colors.primary", text}`) — from the /tokens sheet.
  The fix is an edit to the YAML of the theme named by `theme_key`
  (`c:`/`e:`/`v:` scopes live in the client folder). A `g:` theme is
  core-owned — put the change in a client-scoped theme instead, or flag it.
- **kit** (`{component, text}`) — from the kit catalog. The kit is never
  modified for one client's feedback: look complaints → the client's
  theme; behavior → wrap or copy into the client's `components/`; genuine
  kit defects → flag for the core owner in your summary.
- **page** — no element; the comment is about the route as a whole.

`theme_key` and `viewport` are capture context: "too cramped" may be
theme- or viewport-specific even on source anchors — check whether the
fix belongs in the theme YAML rather than the page.

## Steps

1. Read the client's `CLAUDE.md` brief first (vocabulary matters: feedback
   saying "rename to X" must use the client's terms exactly).
2. Fetch open threads (MCP `list_threads`), or parse the pasted payload.
3. Apply each at the anchored site. All repo rules hold, especially the
   kit-mutation rule and tokens-over-hardcoded-values.
4. A request may be wrong or unwise — push back. Resolve it `rejected`
   with the why in a reply rather than applying something that breaks the
   brief or the contract.
5. Run `pnpm lint && pnpm format:dir clients/<client> && pnpm typecheck &&
pnpm boundaries`. One commit per client in the batch:
   `Apply feedback batch: <n> applied, <n> rejected (<client>)`.
6. Write every resolution back (MCP `reply_to_thread` then
   `set_thread_status`): a reply saying what changed or why not — the
   commenter sees it on their surface — then `applied`, `rejected`, or
   `outdated`. Summarize per thread in the session too.

## Rules

- Never write outside `clients/<client>/` (theme YAML included).
- One batch, one commit per client — individually revertable.
- Never leave a handled thread `open`: the status write-back is the
  client-visible receipt, not an optional nicety.
- Verify visually in the dev server when available: the commented pages
  should reflect every applied item.
