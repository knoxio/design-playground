---
name: handoff
description: Produce the engagement's exit package for a client — finalized PRD, tokens, component inventory, real-vs-mocked declaration, screenshots. Use when an engagement ends or when asked for a handoff or addendum.
---

# Handoff

Produce `clients/<id>/handoff/` — what engineers build the real product
from. Mechanics live in `pnpm handoff <id>` (tokens.json, components.md,
the real-vs-mocked skeleton, screens/); this skill drives that script and
owns the judgment artifacts. The prototype is reference, never shipped.

## Steps

1. Read the client's `CLAUDE.md` brief and `clients/<id>/docs/prd.md`. If `clients/<id>/docs/prd.md`
   does not exist, stop and tell the user: either run
   `/brief-from-transcript` to create it first, or get explicit approval
   to derive `handoff/prd.md` from the brief alone — and flag that origin
   in the document's header.
2. **Block on unresolved items.** List every PRD item still tagged
   `assumed` or `open`, and every experiment still `status: active` — an
   undecided experiment is an open item, and handoff exports Main only,
   so its work vanishes from the package unless surfaced. Do not proceed
   silently: each item is either resolved now with the user (decide or
   archive the experiment, confirm the PRD item) or explicitly carried
   into the final PRD under "Open engineering questions". Silence is the
   failure mode this step exists to prevent.
3. Make sure the dev server is running (`pnpm dev`), then run
   `pnpm handoff <id>`. It writes tokens.json (DTCG), components.md, the
   real-vs-mocked skeleton, and chrome-less screens/ of every main page.
   Open each screenshot and confirm it shows only the product canvas;
   regenerate before shipping if any playground UI leaks in.
4. Write `handoff/prd.md` — the client PRD finalized: confirmed items as
   requirements, carried-over questions in their own section, statuses
   removed. This is the engineers' spec, not a playground document: no
   playground jargon (variants, graduation) without a one-line gloss.
5. **Review `real-vs-mocked.md`** — replace every TODO with verified
   statements by reading the actual pages: flows that look functional but
   are static, brief constraints the UI must not imply (check the brief's
   out-of-scope list, if one exists), fake latency, missing states.
   Delete what doesn't apply. The user reviews the result — never ship it
   unreviewed; if no reviewer is available in this session, stamp the
   file `DRAFT — PENDING REVIEW` at the top and say so in the commit
   message.
6. Sanity-check `components.md` against the rendered app; the inventory
   is import-based and can over-report (kit usage inside client
   components counts the same as page usage) and under-reports by design
   (experiments are excluded). Correct what you can verify, then add the
   "what it does" context for client components.
7. Gate (`pnpm lint && pnpm format:dir clients/<id> && pnpm typecheck &&
pnpm boundaries`), then one commit: `Handoff package: <client>`.

## Addendum mode

For support-period changes (`/handoff <id> --addendum <experiment>`):
write `handoff/addendum-<experiment>.md` instead of regenerating —
what changed and why (from the experiment's question + rationale), new
tokens or components, updated real-vs-mocked entries, fresh screenshots
of only the affected pages (run the script, keep only the relevant
screens). One page, delta only.

## Rules

- Never write outside `clients/<id>/`.
- The package must be self-contained: an engineer who has never seen the
  playground can state what to build, with which tokens, and what not to
  trust from the prototype.
- Real client data never appears anywhere in the package.
- Edits to `handoff/` are legal only during a `/handoff` (or addendum)
  run — that is what the folder contract's "never hand-edited" means.
