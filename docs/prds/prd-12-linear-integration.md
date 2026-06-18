# PRD-12 — Linear integration

**Status:** Built — the `/feedback-from-linear` skill ships (MCP-dependent; exercised as a layer-2 eval, see [reference/testing.md](../reference/testing.md)).
**Owns:** a skill that ingests Linear issues into playground comment threads / experiments and optionally posts preview URLs back
**Depends on:** PRD-05 (the comment thread service issues land in), PRD-04 (experiments issues may attach to), PRD-08 (the preview URLs posted back)
**Governing ADRs:** [0017-feedback-engine-is-claude-session](../adr/0017-feedback-engine-is-claude-session.md), [0008-access-based-confidentiality](../adr/0008-access-based-confidentiality.md), [0014-claude-only-authoring](../adr/0014-claude-only-authoring.md)

## Problem

Feedback that lives in Linear round-trips into the playground by hand: Mary reads
an issue, finds the screen, and re-enters it as a comment. The Linear MCP is
already connected, so a skill can read issues, land them on the right thread or
experiment, and write the matching preview URL back onto the issue — closing the
loop without manual copy-paste.

## Design

### `/feedback-from-linear` skill (ingest + post-back)

- **Inputs:** the client id and a Linear scope to ingest (a project, a label, a
  filter, or specific issue ids). The Linear MCP is the data source — no new
  service.
- **Ingest:** for each matched issue, create or update a comment thread in the
  feedback service (PRD-05) for the client. The issue title and body become the
  thread's first message; the issue's route or screen reference (where present)
  sets the thread's `route`/anchor; the Linear issue id is recorded so re-runs
  update the same thread rather than duplicating it. Issues that name a design
  question rather than a single-screen change are surfaced as experiment
  candidates (PRD-04) for Mary to open, not auto-created.
- **Post-back (optional):** write the client's preview URL — the canonical
  deep-link for the addressed surface (PRD-10) when known, the client preview
  root otherwise — onto the originating Linear issue as a comment or attachment.
- Authorship and identity follow the feedback service's rules (PRD-05): threads
  created by the skill are authored as the session, statuses stay
  Helix-moderated.

### Confidentiality

The post-back must respect access boundaries (ADR
[0008](../adr/0008-access-based-confidentiality.md)): a preview URL is only
posted to a Linear workspace authorized to see that client, and the client-side
Linear access assumption is verified before the URL round-trip is relied on. No
client's URL, name, or work is posted into another client's context.

## Behavior / acceptance

1. `/feedback-from-linear marlow --project "Portal feedback"` creates one comment thread per
   issue on the Marlow feedback service, deduplicated by Linear issue id on
   re-run.
2. An issue carrying a screen reference lands its thread on that route; an issue
   posing a design question is surfaced as an experiment candidate, not
   auto-created.
3. With post-back enabled, the originating issue gains a comment carrying the
   client's preview URL (a canonical deep link when the surface is known).
4. No client's preview URL is posted to a Linear scope not authorized for that
   client.

## Non-goals

- Two-way status sync of every Linear field — ingest is the path; post-back is a
  single URL, not a mirror.
- Replacing the feedback service with Linear — Linear is a source and a
  destination, the thread store stays canonical.
- Auto-deciding experiments from Linear state — graduation stays Mary's call
  (PRD-04).
