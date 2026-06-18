---
name: feedback-from-linear
description: Ingest Linear issues into playground comment threads for a client and optionally post preview URLs back. Use when a client's feedback lives in Linear and you want it on the playground feedback service without manual copy-paste.
---

# Feedback from Linear

Read Linear issues via the Linear MCP, land them on the client's feedback
threads (the same store [`/apply-feedback`](../apply-feedback/SKILL.md) reads),
and optionally write the matching preview URL back onto the issue. Realizes
[`prd-12`](../../../docs/prds/prd-12-linear-integration.md). Linear is a source
and a destination; the thread store stays canonical.

## Inputs

- **client** (required): an existing client id.
- **scope** (required): the Linear issues to ingest — a project, a label, a
  filter, or specific issue ids.
- **post-back** (optional, default off): write the client's preview URL back
  onto each originating issue.

## Ingest

1. Read the client's `CLAUDE.md` brief for vocabulary and the screens in scope.
2. Pull the matched issues via the Linear MCP (`list_issues` / `get_issue`).
3. For each issue, create or update a thread on the feedback service for the
   client. Threads are created with `POST $HX_FEEDBACK_URL/threads?client=<id>`
   (Access token from `.env`; same service `/apply-feedback` uses). The issue
   title + body become the thread's first message.
   - **Route/anchor:** if the issue names a screen or carries a deep link, set
     the thread's `route` to that canonical address (and anchor where given);
     otherwise leave it on the client root and note that in the message.
   - **Dedup:** record the Linear issue id in the thread (in the first message,
     e.g. a trailing `linear:<issue-id>`) and, on re-run, match existing threads
     (`list_threads` via the `hx-feedback` MCP) by that id — update, never
     duplicate.
4. An issue that poses a **design question** rather than a single-screen change
   is surfaced as an **experiment candidate** (PRD-04) for Mary to open with
   `/new-experiment` — never auto-created.
5. Threads created by the skill are authored as the session; statuses stay
   Helix-moderated (PRD-05).

## Post-back (optional)

- When enabled, add a comment/attachment to the originating Linear issue
  carrying the client's preview URL — the canonical deep link for the addressed
  surface when known, the client preview root otherwise.
- **Confidentiality (ADR-0008):** only post a client's preview URL to a Linear
  workspace authorized to see that client. Verify the client-side access
  assumption before relying on the round-trip. Never post one client's URL,
  name, or work into another client's context.

## Rules

- Linear is a source and a destination, not a replacement — the thread store is
  canonical and statuses are moderated in the playground.
- Ingest is the path; post-back is a single URL, not a field-by-field mirror.
- Never auto-decide experiments from Linear state — graduation is Mary's call.
- MCP-dependent: if the Linear MCP isn't connected, say so and stop rather than
  guessing issue contents.
