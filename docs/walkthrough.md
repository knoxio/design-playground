# Walkthrough — Marlow Freight, end to end

A fictional but realistic engagement, written as the sequence of things Mary
actually does. Every numbered beat references the capability it depends on;
[`roadmap.md`](roadmap.md) maps those to their PRDs and build status. Marlow
Freight is invented — any resemblance to a real client is accidental.

## The client

Marlow Freight is a mid-size freight broker. Customers currently email or call
for quotes and shipment status. They want a self-service customer portal:
request a quote, accept/book it, track shipments, see invoices. Brand: navy,
amber accent, utilitarian, dense tables — "more like a terminal than a
brochure," their ops lead says in the kickoff.

## Week 1, Day 0 — kickoff

1. Mary records the kickoff meeting. She asks scope, vocabulary, brand,
   workflow questions. **[C1: recording/transcription is outside the
   playground — any transcript source works]**
2. Back at her desk, she opens Claude Code in the playground repo and runs the
   brief skill with the transcript. It produces:
   - `clients/marlow/CLAUDE.md` — the brief: who Marlow is, the problem, agreed
     scope, vocabulary ("consignment", never "package"; "carrier", never
     "vendor"), brand adjectives, open questions from the meeting.
   - `clients/marlow/docs/prd.md` — a PRD skeleton with the discussed features
     as sections, each marked confirmed/assumed/open.
     **[C2: transcript → brief pipeline]**
3. The same session scaffolds the client per the folder contract
   ([`reference/client-folder-contract.md`](reference/client-folder-contract.md)): `client.yaml`,
   `themes/default.yaml` forked from the Helix standard, a minimal home
   page. The app discovers the new client from the filesystem — nothing is
   registered, nobody touches `app/`, Mary's PR touches only
   `clients/marlow/**` and merges on green. **[C3: client scaffolding]
   [C4: filesystem discovery]**

## Week 1, Day 1 — design system

4. Mary prompts: "Marlow's brand is navy #1B2A4A with amber accent, dense and
   utilitarian. Start from the Helix standard but tighter spacing, smaller
   radius, tabular numbers for anything monetary." Claude edits
   `clients/marlow/themes/default.yaml`, annotating choices with comments she
   can read back. **[C5: theme schema rich enough to express this — type
   scale, density, shadows]**
5. She opens the client's **kit gallery** — every shared-kit component rendered
   under Marlow's tokens — to judge the design system before any page exists.
   She iterates on tokens against it. **[C6: per-client kit gallery page]**
6. In the gallery she flips between Marlow's default theme and two quick
   alternates Claude generated (`themes/warm.yaml`, `themes/contrast.yaml`)
   to compare directions with the styleset switcher. She keeps the original
   and deletes the alternates. **[C7: live styleset swap]**

## Week 1, Days 2–4 — first prototype

7. Mary prompts pages out of the brief: Dashboard (active consignments,
   pending quotes), Quote request, Quote list, Consignment tracking detail,
   Invoices. Claude builds them in `clients/marlow/pages/` from shared-kit
   components plus Marlow mock data in `clients/marlow/data/`. **[C8:
   prototyping conventions — mock data rules, page structure, what Claude may
   and may not touch]**
8. The quote request flow is contested: ops lead wanted a single dense form,
   the MD wanted a guided wizard. Mary creates one experiment — `quote-flow`
   ("single dense form, or guided wizard?") — with two variants, named
   neutrally `juniper` (dense form) and `banksia` (wizard) so the client
   can't anchor on a loaded name. Each variant fully replaces the quote
   pages; everything else falls through to Marlow's main pages, so flipping
   variants always shows a complete app. **[C9: experiment/variant
   lifecycle — create, flip, compare]**
9. The tracking page needs a status timeline the kit doesn't have. Claude
   builds `clients/marlow/components/StatusTimeline.tsx` _inside the client
   folder_ per the kit-mutation rule. It looks generally useful; Mary notes it
   as a promotion candidate. **[C10: promotion path from client component to
   shared kit — a reviewed PR ritual, plus somewhere the candidates are listed]**

## Week 1, Day 5 — internal + first client review

10. Engineers skim the prototype on the internal app and leave notes ("carrier
    ETAs come from a slow upstream API — don't promise live updates in the
    UI"). Mary adjusts. **[C11: internal review = the running app + normal PR
    flow; no new capability]**
11. Mary demos to Marlow over a call, screen-sharing the internal app, flipping
    between the `juniper` and `banksia` variants live. Client reacts; she
    captures decisions in the brief.

## Week 2 — async client iteration

12. Mary adds the stakeholders' emails to `client.yaml`'s `preview` block
    and merges; the Marlow preview (its own Cloudflare Pages deploy,
    physically containing only Marlow's folder) now lets them in via
    Cloudflare Access. PROTOTYPE banner on, comment mode on. **[C12: scoped
    builds + banner] [C15: deployment & access]**
13. The ops lead drops comment threads right on the elements: a pin on the
    quote table ("needs carrier and ETA columns"), a pin on the button
    ("should say 'Book consignment'"). Threads persist in the feedback
    service; Mary sees them in her internal app too, where she can also pin
    her own source-anchored notes via inspect mode. **[C13: overlay] [C16:
    comment threads]**
14. Mary runs `/apply-feedback` in her session: it pulls the open threads,
    applies each, commits, marks them `applied` (one gets `rejected` with a
    reply explaining why). Merge to main auto-redeploys the preview — the
    ops lead refreshes and sees both the changes and the thread resolutions.
    Three rounds of this happen over the week, no clipboard, no email.

## Week 2, end — decision and handoff

15. Marlow picks the wizard. Mary **decides** the experiment: `banksia`'s
    pages merge into Marlow's main `pages/`, `experiment.yaml` records the
    choice and rationale, the brief's decision log gets a line, and `juniper`
    stays in git untouched. Main pages are again the single canonical
    prototype — there is no stack of overlays. **[C9 again: decide =
    graduation by merge]**
16. She runs the handoff skill. It produces `clients/marlow/handoff/`:
    - final PRD (the skeleton, now confirmed against everything built),
    - `tokens.json` — the design system as a portable artifact,
    - component inventory — every kit + client component used, with props,
    - **real-vs-mocked** — explicit list of illusions: mock data, no auth,
      instant "API" responses, no error states, no permissions.
      Engineers build the real app in their own repo from this. **[C14: handoff
      package generation]**

## Month 4 — support period

17. Marlow asks for CO₂ estimates on quotes. Mary opens the same client
    folder — brief, themes, pages all still there — creates a
    `quote-emissions` experiment (single variant; experiments always have
    `variants/`, even uncontested ones), prototypes it in an afternoon,
    client approves from a preview link, engineers get a one-page handoff
    addendum. **[everything above, re-exercised; the client folder as the
    living reference]**

## What this walkthrough deliberately does not include

- Voting on variants (deciding is Mary's call, recorded by graduation —
  comments, by contrast, are in: the threads in beats 13–14).
- Multi-designer concurrency (Mary is the sole editor).
- Any backend behind the prototypes themselves: every prototype interaction
  is mock-driven by design (the feedback service is playground
  infrastructure, not client-product backend).
