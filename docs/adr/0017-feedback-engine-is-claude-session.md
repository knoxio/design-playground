# 0017 — The feedback engine is Mary's Claude session

**Status:** Accepted

## Context

Mary and clients point at things in the rendered prototype — an element, a
token, a whole page — and that pointing must survive the trip to Claude and
come back as an applied change. The question is what _drives_ the loop: where
the agent that reads a comment and edits the code actually runs. The natural
temptation is to embed an AI session in the page so a reviewer edits in place.

## Decision

The loop's engine is **Mary's interactive Claude Code session** — the same
subscription-priced session she authors in. Nothing in the loop is metered.

The page hosts only a Figma-style commenting overlay: click an element (or
comment on the page) → a thread in the feedback service (ADR-0008), pinned as
a status-colored dot, with context (client, route, theme, viewport) and an
anchor that degrades by surface. Threads carry statuses
`open | applied | rejected | outdated`. The `design-feedback` MCP server exposes
the stored threads to Mary's session as structured tools; "Copy for Claude"
is the offline export of the same data. `/apply-feedback` pulls open threads,
applies each (kit-mutation rule enforced, ADR-0004), commits, and sets
statuses with reply messages the commenter sees. Merge auto-redeploys
previews, closing the loop.

## Consequences

- No API key, no per-edit metering — the casual-iteration workflow stays free
  of usage cost, which is the whole point.
- The overlay stays a thin commenting surface; all generation lives in the
  session that already has the repo, the skills, and the boundary rules.
- The payload format, the skill, and the service carry over unchanged if
  Design later pays for in-page editing.

## Alternatives

**Embedded Agent-SDK session in the page.** Technically proven — streaming,
permission fencing, and session resume all work — but the SDK requires an API
key (it does not ride subscription auth), and per-edit metering balloons in
exactly this casual-iteration workflow. Rejected; revisit only if Design wants
to pay for one-click in-page comfort.
