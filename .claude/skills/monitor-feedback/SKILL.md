---
name: monitor-feedback
description: Watch a client's feedback comments and auto-apply them as they arrive. Use when asked to monitor/watch comments, auto-pull feedback, or react to comments live during a review. Event-driven via a background watcher.
---

# Monitor feedback

Event-driven monitor for the comment overlay: a background watcher long-polls the
feedback service and exits the moment a new open comment appears; the harness
re-invokes the session, you apply + resolve the comment, then re-arm the watcher.
It only spends tokens when there is actually something to do (mirrors how
`gh run watch` is used for a PR).

## Inputs

- **client** (required): the client whose comments to watch (e.g. `marlow`).
- **since** (optional): ISO timestamp. Omit on first run to start from "now" so
  only new comments fire.

## Prerequisite

The watcher and the `design-feedback` MCP both authenticate with the Cloudflare
Access service token in the repo-root `.env`. If it is missing, stop and point
the user at the feedback-service setup in `docs/guides/getting-started.md` — do
not invent credentials.

## Loop

1. **Drain existing open comments first.** The watcher only catches activity
   after it starts, so call the `design-feedback` MCP `list_threads` (open) and
   apply + resolve each one (step 3) before arming. Skipping this is why
   already-posted comments get missed.
2. Arm the watcher in the background (Bash with `run_in_background: true`):
   `node scripts/feedback-watch.mjs <client>` (since defaults to now). It exits
   when new activity arrives, or after `WATCH_MAX_MS` (default 30m) with a
   timeout marker.
3. When it exits, the harness re-invokes you with its JSON output:
   - `changed: true` with `threads` + `latest` — for each thread, apply the
     comment to the client source with the same discipline as `/apply-feedback`
     (shared-kit mutation rule, module boundaries, then `pnpm run ci`), commit,
     and **resolve it**: reply via the `design-feedback` MCP and set the thread
     `applied` (or `rejected` with a reason). Resolve each as you execute it.
   - `timedOut: true` — nothing arrived; just re-arm.
4. Re-arm: repeat step 2 (since defaults to now; resolved threads never refire
   because the watcher filters to open).
5. Stop when the user says stop.

## Rules

- Do not auto-apply destructive, ambiguous, or out-of-scope changes unattended —
  surface those and ask, exactly as `/apply-feedback` would.
- One comment, one applied change, one resolution — keep the thread statuses
  truthful so the operator sees real progress.
- A simpler timer alternative is `/loop <interval>` calling the `design-feedback`
  MCP `list_threads` (open-only), at a higher token cost than this watcher.
