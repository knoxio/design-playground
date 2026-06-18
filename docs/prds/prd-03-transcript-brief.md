# PRD-03 — Transcript → brief & PRD skeleton

**Status:** Built
**Owns:** C2 (transcript → brief + PRD skeleton skill)
**Depends on:** PRD-01 (writes into the scaffolded client folder); develops in parallel — it is a skill, not app code
**Governing ADRs:** [0014-claude-only-authoring](../adr/0014-claude-only-authoring.md), [0001-one-app-clients-as-folders](../adr/0001-one-app-clients-as-folders.md)

## Problem

The brief is what makes Claude generate the client's product instead of generic
SaaS UI. Written by hand it is thin, inconsistent, or skipped. The kickoff
transcript holds everything needed; something turns it into a usable artifact
without inventing scope — a hallucinated requirement here poisons every
downstream prototype.

## Design

### `/brief-from-transcript` skill

- **Inputs:** a transcript (file path or pasted text) and an existing client id.
  Transcription itself is out of scope — any source (Granola, Whisper, manual
  notes) works; fidelity of the source is Mary's responsibility.
- **Writes** into `clients/<id>/`:
  - **`CLAUDE.md`** — the brief, fixed sections: Who they are · The problem ·
    Agreed scope · Out of scope · Design system decisions · Vocabulary · Key
    people · Open questions · Decision log.
  - **`docs/prd.md`** — a skeleton: one section per discussed feature, each
    tagged `[confirmed]`, `[assumed]`, `[open]`, or `[rejected]`, with the
    supporting quote or note under the tag.
- The skill writes only inside `clients/<id>/`.

### The traceability rule

Every claim in the brief or PRD is traceable to the transcript or carries an
explicit `[assumed]` marker. Scope is never invented. Items the client raised
and rejected or deferred go under **Out of scope** in their own words ("not this
year"), never silently dropped — the next session must know they were discussed.
A `[rejected]` PRD item keeps the resolving quote and date: discussed-and-declined
is information, not noise. Ambiguity goes into **Open questions** with who can
answer it; the skill does not resolve it itself.

### Quality bar

- The Vocabulary section exists even when short — terms to use and terms to
  avoid ("consignment, never package") are the highest-leverage lines in the
  file.
- Open questions each name who can answer them.
- Brand adjectives land in Design system decisions even when vague — "relaxed,
  warm" is a usable starting direction for `/new-theme`.

### Update mode

Re-running on a later transcript (a review call) updates rather than replaces:
it appends new decisions, flips `[open]` items as they resolve, and never
silently rewrites confirmed scope. Changes land as a normal diff Mary can read.

## Behavior / acceptance

1. A realistic 45-minute kickoff transcript produces a brief and PRD skeleton a
   cold-start session can prototype from without re-asking scope questions the
   meeting already answered.
2. A second transcript updates rather than replaces; confirmed items survive,
   `[open]` items that were resolved flip.
3. The skill writes only inside `clients/<id>/`.

## Non-goals

- Audio handling, diarization, meeting-bot integration.
- Auto-updating prototypes when the brief changes — Mary drives that.
