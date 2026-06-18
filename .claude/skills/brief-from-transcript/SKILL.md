---
name: brief-from-transcript
description: Turn a client meeting transcript into the client brief (CLAUDE.md) and PRD skeleton, or update them after a follow-up meeting. Use after kickoffs, review calls, or any meeting that changes scope or decisions.
---

# Brief from transcript

The brief is what makes every later prototyping session produce _this
client's_ product instead of generic UI. It is only trustworthy if nothing
in it was invented.

## Inputs

- **client id** (required, must exist — run `/new-client` first if not).
- **transcript** (required): file path or pasted text. Any source — meeting
  notes count; fidelity of the source is Mary's responsibility.
- **context**: meeting date and type (kickoff / review / other), attendees
  if known. Ask if unclear.

## The traceability rule (overrides everything else)

Every claim written into the brief or PRD must be traceable to the
transcript, or carry an explicit `[assumed]` marker. Never invent scope.
Items the client mentioned and rejected or deferred go under **Out of
scope** with their words ("not this year"), not silently dropped — the next
session must know it was discussed. When the transcript is ambiguous, write
the ambiguity into **Open questions** with who can answer it; do not resolve
it yourself.

## Outputs

**`clients/<id>/CLAUDE.md`** — the brief, fixed sections: Who they are ·
The problem · Agreed scope · Out of scope · Design system decisions ·
Vocabulary · Key people · Open questions · Decision log.

- Vocabulary is mandatory even if short — terms to use and terms to avoid
  are the highest-leverage lines in the file.
- Open questions each name who can answer ("Sarah to confirm").
- Brand adjectives go to Design system decisions even when vague — "relaxed,
  warm" is a usable starting direction for `/new-theme`.

**`clients/<id>/docs/prd.md`** — skeleton: one section per discussed
feature, each tagged `[confirmed]`, `[assumed]`, `[open]`, or `[rejected]`
(rejected keeps the resolving quote and date — discussed-and-declined is
information, not noise), with the supporting quote or note under the tag.

## Update mode (re-run on a later transcript)

When the brief already has content beyond the template:

- **Append and flip, never rewrite.** New decisions are added; `[open]`
  items flip to `[confirmed]`/rejected with the new quote; confirmed scope
  is never silently altered — if the client reversed a confirmed item,
  record the reversal explicitly ("was X, changed to Y on <date>").
- Meeting-level decisions land as dated lines in the brief's Decision log
  — from any meeting, the kickoff included (experiment graduations also
  write there; both kinds coexist).
- A resolved Open question is removed and replaced by where its answer now
  lives ("None open as of <date>" when the list empties, with pointers to
  the Decision log / Out of scope entries that resolved them).
- Finish by showing Mary the diff (`git diff`) — the update must read as an
  honest delta of the meeting.

## Steps

1. Read the full transcript, then the existing brief and PRD (update mode
   detection).
2. Draft the outputs per the rules above.
3. Self-audit before writing: for each Agreed-scope and `[confirmed]` item,
   locate the supporting statement; anything you cannot locate gets
   `[assumed]` or moves to Open questions.
4. Write the files; run `pnpm format:dir clients/<id>`.
5. Commit (one operation, one commit).

## Rules

- Never write outside `clients/<id>/`.
- Never paste raw transcript chunks into the brief — distill; quotes only
  where they carry decision weight or vocabulary.
- The transcript itself does not get committed to the repo unless Mary asks
  (it may contain off-record remarks); the brief is the durable record.
