# Design Playground — Product & Technical Specification

**Status:** HISTORICAL — superseded by `helix-playground-spec.md` (2026-06-10). Kept as
discovery context; the build model changed substantially after scoping review.
**Audience:** Software engineer(s) implementing the product
**Product owner:** Senior designer (non-technical)
**Last updated:** 2026-06-02

> **How to read this doc.** Sections 1–4 are product context. Sections 5–15 are the
> buildable spec. Where the owner deferred a technical choice, the recommendation is
> stated with rationale and tagged **[REC]**. Anything still genuinely undecided is
> tagged **[OPEN]** in §16. The owner does not edit code, so every authoring action
> must be possible through the UI (canvas + prompts), never the codebase.

---

## 1. Vision

A Figma-like **design playground** where a senior designer experiments with designs,
builds interactive prototypes, applies a per-client design system, generates UI from
text/voice/image prompts, compares variants, and pushes the chosen design to GitHub as a
pull request containing **production-ready component code + design tokens** for engineers
to build from.

The defining constraint: designs are **code-backed components arranged on a freeform,
malleable canvas** (hybrid model). What the designer manipulates _is_ the thing that
ships — there is no lossy "redraw it in code" handoff step.

## 2. Primary user & workflows

- **Designer** — sole editor. Creates projects, attaches/builds design systems, generates
  and manipulates designs, makes variants, builds prototypes, opens PRs.
- **Engineer** — view + comment; consumes PRs.
- **Stakeholder** — view + comment; reviews prototypes via shared links.

Core loop: `Create project → attach design system → new file → prompt/generate →
manipulate on canvas across breakpoints → branch into variants → review & choose →
prototype for stakeholders → push chosen variant to GitHub PR.`

## 3. Confirmed product decisions (from discovery)

| Area                       | Decision                                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| Design model               | **Hybrid**: code-backed components on a freeform, Figma-like canvas                                       |
| Target output stack        | **Per-project**, set at project creation; **default React + Tailwind**                                    |
| PR contents                | **Production-ready component code + design tokens**                                                       |
| Platform                   | **Web app**, cloud-hosted SaaS, **single-tenant** (v1)                                                    |
| Collaboration              | **Single editor, async** (multiplayer is future)                                                          |
| Users (v1)                 | Designer + engineers (+ stakeholder viewers)                                                              |
| Breakpoints                | **Multiple**; defaults **Mobile 375×812, Tablet 768×1024, Desktop 1440×1024** (configurable)              |
| Fidelity                   | **All three**: low-fi → hi-fi → production                                                                |
| Editing                    | **Direct manipulation + follow-up prompts only** (no code editing in-tool)                                |
| Breakpoints                | **Multiple** (mobile/tablet/desktop, configurable) — high priority                                        |
| AI provider                | **Anthropic API**                                                                                         |
| Voice                      | **Dictation only** (no voice commands)                                                                    |
| Generation source of truth | **Start from design system**; flag freeform areas; let designer reconcile new components back into the DS |
| Image input                | **Yes** — "make it look like this" is required                                                            |
| GitHub auth                | **OAuth** (see §11 for the GitHub App refinement)                                                         |
| Repo strategy              | **One repo per project/client**                                                                           |
| PR conventions             | Industry standard                                                                                         |
| Handoff direction          | **One-directional** (no round-trip sync in v1)                                                            |
| Design system creation     | **Manual in-tool + AI-generated** (Figma and code/Storybook import deferred past v1)                      |
| DS scope                   | **One per project**                                                                                       |
| DS ↔ code mapping          | **1:1** with the engineers' codebase components                                                           |
| Variants                   | **Fork** + **AI N-alternatives**; switch via **dropdown toggle**                                          |
| Variant decisions          | **Voting + commenting + tracked "chosen"**                                                                |
| Chosen → PR                | **Manual** push, never automatic                                                                          |
| Prototyping                | **Genuinely interactive** (real components), with **preset transitions** (v1)                             |
| Prototype sharing          | **Public view-only links + commenting**                                                                   |
| A11y target                | **WCAG 2.2 Level AA**                                                                                     |
| A11y enforcement           | **Score** (never block); **real-time + on-demand**                                                        |
| A11y in output             | Design with **accessible tokens**; ship exactly what's designed                                           |
| Comments                   | Figma-style comment pins/boxes on the canvas                                                              |
| Asset storage              | Cloud object storage (Cloudflare R2); **licensing is the user's responsibility**                          |
| MVP                        | DS + UX/a11y skills + hierarchy + prompting + GitHub = one end-to-end flow                                |

## 4. Out of scope for v1

The owner said "nothing is out of scope," but the build must be sequenced (see §15
phasing). The following are explicitly **deferred past the first shippable slice**, not
cancelled: real-time multiplayer, round-trip GitHub sync, **Figma import**, code/Storybook
DS import, voice commands, AAA conformance, multi-tenancy, and team/multi-designer accounts.

---

## 5. Recommended technology stack **[REC]**

The owner is non-technical and asked for "stable and commonly used." These choices
optimize for hiring ease, ecosystem maturity, and fit to a code-backed canvas.

| Layer              | Choice                                                                                                        | Why                                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language           | **TypeScript** everywhere                                                                                     | One language front-to-back; type safety across the design-document model                                                                                                                                                                 |
| Frontend framework | **React 18 + Vite**                                                                                           | The output stack is React; using React internally lets the live canvas render the _actual_ components that will ship                                                                                                                     |
| Canvas engine      | **tldraw SDK** (custom shapes) **[REC]**                                                                      | Provides infinite canvas, pan/zoom, selection, snapping, and undo out of the box, and supports **custom React/HTML shapes** — the key to a code-backed (not vector) canvas. Alternative: build a bespoke canvas (far more work). See §7. |
| Styling            | **Tailwind CSS**                                                                                              | Matches default output; utility classes map cleanly to design tokens                                                                                                                                                                     |
| Backend            | **Node.js + NestJS**                                                                                          | Opinionated, modular structure suits a multi-person team and a large domain                                                                                                                                                              |
| API style          | **tRPC** (internal) + **REST/webhooks** (GitHub, share links)                                                 | tRPC gives end-to-end types between the React app and Node backend                                                                                                                                                                       |
| Database           | **PostgreSQL + Prisma** **[REC]**                                                                             | Relational model fits the strict hierarchy, permissions, comments, votes, and audit trail; Prisma gives typed queries and migrations                                                                                                     |
| Document store     | Design documents stored as **JSONB in Postgres**, with periodic snapshots                                     | The design tree is a JSON document; Postgres JSONB avoids a second datastore in v1                                                                                                                                                       |
| Auth               | **Auth.js (NextAuth core) or Clerk** with GitHub + email                                                      | Battle-tested; Clerk if you want hosted user management with less code                                                                                                                                                                   |
| Object storage     | **Cloudflare R2** (S3-compatible)                                                                             | Honors the owner's preference; generous free tier; signed URLs for assets                                                                                                                                                                |
| AI — design gen    | **Anthropic Claude API**                                                                                      | Per the owner; strong at structured output (component trees) and vision (image input)                                                                                                                                                    |
| AI — transcription | **Deepgram Nova-3** **[REC]**                                                                                 | High accuracy, low per-minute cost, low maintenance (hosted). Fallback: browser Web Speech API (free, but inconsistent across browsers). Alt: OpenAI Whisper API                                                                         |
| Token tooling      | **W3C DTCG token format → Style Dictionary** **[REC]**                                                        | DTCG JSON is the emerging cross-tool standard; Style Dictionary transforms it into Tailwind config, CSS variables, and any target the repo needs                                                                                         |
| Hosting            | Frontend on **Cloudflare Pages/Vercel**; backend on **Render/Fly.io/Railway**; DB managed (Neon/Supabase/RDS) | All common, low-ops                                                                                                                                                                                                                      |
| Background jobs    | **BullMQ + Redis**                                                                                            | Codegen, PR creation, audits, and transcription run as async jobs                                                                                                                                                                        |

---

## 6. Domain model & hierarchy

```
Workspace (the designer's account)
└── Project              ← one client/company; owns target-stack config + GitHub repo link
    ├── DesignSystem      ← exactly one per project (tokens + components + mappings)
    └── File              ← one per feature/flow
        └── Variant       ← competing options within a file (1..N); one may be "chosen"
            ├── Artboard   ← one per breakpoint (mobile/tablet/desktop/custom)
            │   └── Node…  ← the design tree (components + freeform elements)
            └── Prototype  ← interactive flow built from this variant's artboards
```

### 6.1 Key entities (Prisma-level sketch)

- **User** `{ id, email, name, avatarUrl, role, githubId? }`
- **Project** `{ id, name, clientName, targetStack (json), githubRepo?, designSystemId, createdAt }`
  - `targetStack` example: `{ framework: "react", styling: "tailwind", componentDir: "src/components", tokenFormat: "dtcg" }`
- **DesignSystem** `{ id, projectId, tokens (DTCG json), createdVia: manual|figma|ai }`
- **DSComponent** `{ id, designSystemId, name, props (schema), codeMapping (json), status: mapped|unmapped|proposed }`
  - `codeMapping` records the 1:1 link to the repo: import path, component name, prop mapping.
- **File** `{ id, projectId, name, description }`
- **Variant** `{ id, fileId, name, origin: forked|ai|manual, sourceVariantId?, isChosen, decisionId? }`
- **Artboard** `{ id, variantId, breakpoint, width, document (jsonb), a11yScore }`
- **Node** — stored inside `Artboard.document` (see §7.1), not its own table.
- **Prototype** `{ id, variantId, flows (json), shareSlug?, isPublic }`
- **Comment** `{ id, targetType, targetId, anchor (x,y / nodeId), authorId, body, resolved, parentId? }`
- **Vote** `{ id, variantId, userId, value }`
- **Decision** `{ id, fileId, chosenVariantId, rationale, decidedBy, decidedAt }`
- **PullRequest** `{ id, variantId, githubPrUrl, branch, status, createdAt }`
- **Asset** `{ id, projectId, r2Key, kind: image|icon|font, filename }`
- **AuditReport** `{ id, artboardId, level: AA, score, findings (json), runAt }`

### 6.2 Permissions matrix

| Capability                           | Designer | Engineer | Stakeholder                         |
| ------------------------------------ | -------- | -------- | ----------------------------------- |
| View projects/files/variants         | ✅       | ✅       | ✅                                  |
| Edit canvas / generate / variant ops | ✅       | ❌       | ❌                                  |
| Comment                              | ✅       | ✅       | ✅                                  |
| Vote on variants                     | ✅       | ✅       | ✅                                  |
| Create GitHub PR                     | ✅       | ❌       | ❌                                  |
| Manage design system                 | ✅       | ❌       | ❌                                  |
| View shared prototype link           | ✅       | ✅       | ✅ (public link, no account needed) |

---

## 7. The design document & code-backed canvas (the core engineering problem)

This is the hardest part of the build and deserves the most care.

### 7.1 Single source of truth: the document tree

Each **Artboard** holds a serializable **node tree**. A node is either a **DS component
instance**, a **primitive** (text, box, image, stack/flex container), or a **proposed
component** (freeform-generated, not yet in the DS).

```jsonc
{
  "root": {
    "id": "n_root",
    "type": "frame",
    "layout": { "mode": "flex", "direction": "column", "gap": 16, "padding": 24 },
    "children": [
      {
        "id": "n_1",
        "type": "component", // DS component instance
        "ref": "dsc_button_primary", // -> DSComponent.id (1:1 mapped to repo)
        "props": { "label": "Sign in", "variant": "primary" },
        "tokenBindings": { "bg": "color.brand.600" },
        "frame": { "x": 0, "y": 0, "w": 160, "h": 44 }, // freeform position/size
      },
      {
        "id": "n_2",
        "type": "proposed", // freeform / no DS match yet
        "name": "PromoBanner",
        "html": "...",
        "css": "...", // generated markup, token-bound where possible
        "needsReconciliation": true,
      },
    ],
  },
}
```

Two facts make the hybrid model work:

1. Nodes carry **freeform geometry** (`frame`) _and_ optional **auto-layout** (`layout`),
   so the canvas feels like Figma but the tree still encodes real layout semantics.
2. Component nodes reference **DSComponent** records that are **1:1 mapped to the repo**,
   so codegen emits real imports, not re-implementations.

### 7.2 Rendering: WYSIWYG via sandboxed iframes

- Each artboard renders its node tree into a **sandboxed iframe** that loads the project's
  Tailwind config + token CSS variables + the DS component library (or faithful stand-ins
  until mapped). This guarantees the canvas shows _exactly_ what will ship.
- A **manipulation overlay** (selection handles, drag, resize, alignment guides) is drawn
  by tldraw above the iframe, with coordinates mapped to nodes. Direct-manipulation edits
  write back to the node tree; the iframe re-renders.
- **No code editing surface is exposed** to the designer (per decision). All edits flow
  through canvas gestures or prompts and mutate the tree.

### 7.3 Breakpoints

- A Variant has one Artboard per active breakpoint. **Default set** (the prevailing
  design-canvas convention as of 2026, configurable per project):
  - **Mobile — 375 × 812** (4-column grid)
  - **Tablet — 768 × 1024** (8-column grid)
  - **Desktop — 1440 × 1024** (12-column grid)
  - Note: real-device mobile usage now skews to 390–393px (current iPhones); 375 remains the
    common _design_ width. Designers can add/override breakpoints per project.
- **[REC]** Default behavior: **Desktop is the primary breakpoint**; edits cascade from it to
  the others, with per-breakpoint overrides (like CSS responsive overrides) so the designer
  isn't redrawing every screen. Each node stores
  `responsive: { tablet?: {...overrides}, mobile?: {...overrides} }`.

### 7.4 Codegen (export pipeline)

A pure function `serialize(artboard, project, designSystem) → files[]`:

- Component nodes → `import { Button } from "<codeMapping.path>"` with mapped props.
- Primitives → semantic React + Tailwind classes derived from `tokenBindings`.
- Proposed nodes → new component files, clearly marked `// TODO: reconcile into design system`.
- Emits the **tokens artifact** (DTCG JSON + the Style-Dictionary-built Tailwind config /
  CSS variables) so the PR carries tokens alongside code.
- Output respects the per-project `targetStack` and the repo's `componentDir`.

---

## 8. AI generation (text, voice, image)

### 8.1 Prompt → design pipeline

1. Designer enters a **text prompt**, dictates (voice→text), and/or attaches an **image**.
2. Backend builds a Claude request containing: the prompt, attached image(s), the project's
   **design-system context** (available tokens + mapped components + their prop schemas),
   the active breakpoint, and the universal **skills context** (NN/g + WCAG 2.2 AA + visual
   hierarchy rules — see §10).
3. Claude returns a **node tree** (structured JSON matching §7.1). Generation is
   **DS-first**: the model must prefer mapped DS components and only emit `proposed` nodes
   where no DS component fits — each flagged `needsReconciliation: true`.
4. Tree is validated, inserted into the artboard, rendered, and auto-scored for a11y.

### 8.2 Follow-up prompts

Refinements ("make the CTA bigger", "use the secondary color") are sent with the current
tree as context; Claude returns a **diff/patch** to the tree, not a full regeneration, to
preserve manual edits.

### 8.3 Voice **[REC]**

Dictation only. Stream mic audio → **Deepgram Nova-3** → text into the prompt box. No
command grammar. Provide browser Web Speech API as a zero-cost fallback when no key set.

### 8.4 Image input

"Make it look like this" — image sent to Claude's vision input alongside the prompt; used
as a visual target. Store uploaded reference images in R2 (user owns licensing).

---

## 9. Design systems & tokens

### 9.1 Creation paths (v1)

- **Manual** in-tool: define color/type/spacing/radius/shadow tokens + components in a DS editor.
- **AI-generated**: prompt → a starter token set + base components, designer-reviewed.
- **Deferred past v1:** Figma import (via Figma REST / Variables API) and code/Storybook
  import. Both are valuable but add significant integration surface; they slot into Phase 8+.

### 9.2 Token format **[REC]**

- **Source of truth:** W3C **DTCG** JSON (`color`, `dimension`, `typography`, etc.).
- **Transform:** **Style Dictionary** builds platform outputs — `tailwind.config`, CSS
  custom properties, and whatever the project repo consumes.
- Rationale: DTCG is the cross-tool standard and round-trips cleanly between design and code.

### 9.3 Component ↔ code mapping (1:1, required)

Each DSComponent stores a `codeMapping`: repo import path, component name, and prop→prop
mapping. Mappings are established when linking the project's GitHub repo (read the
component directory) and confirmed by the designer. Unmapped/proposed components surface in
a **reconciliation queue** where the designer promotes a freeform element into a proposed DS
component.

**Source of truth = the engineering component.** The playground is a place to _play_ with
designs, not the canonical component registry. When a design and the real code component
drift apart, that's expected and acceptable; the designer reconciles it **manually** (re-map
or update the design) — there is no automatic enforcement and, per the one-directional
handoff decision, no auto-sync from the repo. The data model must therefore treat a
DSComponent's `codeMapping` as a _pointer that may go stale_, surfacing a "mapping may be
out of date" hint rather than trying to guarantee consistency.

---

## 10. Universal UX & accessibility "skills" engine

These standards apply to **every** project and design. Grounded in NN/g's 10 heuristics and
WCAG 2.2 AA. The engine has three jobs: **inform generation**, **score continuously**, and
**audit on demand**. It **scores, never blocks** (per decision).

### 10.1 Inform generation

The skills are injected into every Claude generation request as system context, so output
starts accessible: semantic structure, labeled controls, sufficient-contrast token choices,
≥24×24px targets, logical order, visible focus affordances.

### 10.2 Real-time scoring

On every tree change, run checks against the rendered iframe DOM + the node tree:

- **Automated WCAG (via axe-core on the iframe):** contrast (1.4.3/1.4.11), name/role/value
  (4.1.2), labels (3.3.2), heading order/landmarks (1.3.1/2.4.x), target size (2.5.8),
  language, status messages (4.1.3), etc.
- **Custom heuristic checks (NN/g + 2.2 additions):** color-only signaling, focus order vs
  reading order, focus-not-obscured (2.4.11), dragging alternative (2.5.7), consistency of
  repeated components (H4), visible feedback affordances (H1).
- **Visual-hierarchy checks:** type scale adherence, spacing-system adherence, single clear
  primary action per view, heading-size monotonicity.
- Output a **0–100 score** per artboard with a severity-ranked findings list
  (Blocker / Improvement / Polish — mirroring the design-review format).

### 10.3 On-demand audit

A full report per variant/breakpoint, persisted as `AuditReport`, exportable and attachable
to the PR. Score is displayed on the canvas, in the variant switcher, and in the PR summary.

> Conformance target is **AA**. AAA is out of scope for v1.

---

## 11. GitHub integration & handoff

### 11.1 Auth **[REC] (refinement of "OAuth")**

Use **GitHub OAuth** for user sign-in/identity, plus a **GitHub App installation** for repo
operations (read component dir, create branches, open PRs). The App is the standard, robust
way to scope repo access and create PRs; OAuth alone is brittle for this. Net effect for the
user is still a one-click "Connect GitHub" OAuth flow.

### 11.2 Repo linking

One repo per project, set at project creation. On link, the App reads the component
directory to seed/refresh DSComponent `codeMapping`s.

### 11.3 PR creation (manual, per decision)

From a chosen variant, the designer clicks **"Push to GitHub."** A background job:

1. Runs codegen (§7.4) → component files + tokens artifact.
2. Creates a branch (**[REC]** `design/<file-slug>-<variant-slug>`).
3. Commits files; opens a PR using an industry-standard template containing: summary,
   per-breakpoint screenshots, the **a11y score + findings**, list of new/`proposed`
   components needing implementation, and the token diff.
4. **[REC]** Conventional defaults: Conventional-Commits message, labels `design`,
   `needs-build`; auto-request review from repo CODEOWNERS if present.

- Handoff is **one-directional**: no engineer→playground sync in v1.

---

## 12. Variants & decision-making

- **Create:** (a) **fork** an existing variant (deep-copy artboards), or (b) **AI N
  alternatives** (one prompt → several distinct directions as sibling variants).
- **Browse:** a **dropdown toggle** in the file view flicks between variants on the same
  canvas (per decision — not side-by-side).
- **Decide:** per-variant **voting** (designer/engineer/stakeholder) + **comments**; the
  designer marks one **✅ chosen**, recorded as a `Decision` with rationale. The chosen
  badge shows in the switcher.
- Choosing a variant **does not** auto-create a PR; the push is always manual.

---

## 13. Interactive prototyping

- **Genuinely interactive:** because nodes are real components in an iframe, prototype mode
  enables live state/interaction rather than static hotspots. Designer defines flows: links
  between artboards/states, triggers (click/hover/input), and transitions.
- **Transitions — preset library only (v1):** a fixed set of presets (e.g. instant, dissolve,
  slide-in/out by direction, push, smart-animate-lite) each with configurable duration and
  easing. No custom timeline/keyframe authoring in v1 (deferred). This keeps prototyping fast
  and the data model small.
- `Prototype.flows` stores the interaction graph (source node → action → target state).
- **Sharing:** generate a **public, view-only link** (`shareSlug`) — no account needed —
  with **commenting** enabled for stakeholders. Comments thread back into the file's
  comment system.

---

## 14. Comments, assets, persistence

- **Comments:** Figma-style pins anchored to canvas coordinates or specific nodes, with
  threads, resolve, and @-mention. Available to all roles on designs and prototypes.
- **Assets:** images/icons/fonts uploaded to **Cloudflare R2**, referenced by signed URL.
  The platform does **not** assess licensing — accountability rests with the user (surface
  a one-time acknowledgement).
- **Persistence:** Postgres (entities + JSONB documents). Autosave on edit; periodic
  artboard **snapshots** for version history/undo beyond the session.

---

## 15. Non-functional requirements & recommended phasing

### 15.1 Non-functional

- **Autosave** within ~1s of edit; never lose work (visibility-of-system-status, H1).
- **Performance:** canvas interaction 60fps target; large artboards virtualized.
- **Security:** per-project access control; signed asset URLs; GitHub App least-privilege;
  secrets in a vault; public prototype links unguessable + revocable.
- **Observability:** structured logs, error tracking (Sentry), job dashboards (BullMQ).
- **Cost controls:** cache/debounce AI calls; cap tokens per request; per-project usage
  metering (see §16 open budget item).

### 15.2 Recommended build phases

> The owner wants the **end-to-end flow** first. Suggested sequence:

1. **Phase 0 — Foundations:** auth, workspace/project/file hierarchy, Postgres schema, R2.
2. **Phase 1 — Canvas core:** tldraw + custom code-backed shape, iframe renderer, direct
   manipulation, single breakpoint.
3. **Phase 2 — Design systems + tokens:** DTCG + Style Dictionary, manual DS editor,
   AI-generated starter DS, component mapping. (Figma import is _not_ in this phase.)
4. **Phase 3 — AI generation:** text prompt → tree, image input, follow-up patching,
   DS-first generation + reconciliation queue. (Voice can land here or Phase 5.)
5. **Phase 4 — Skills engine:** real-time scoring + on-demand audit (NN/g + WCAG 2.2 AA).
6. **Phase 5 — Handoff:** GitHub App, codegen, manual PR push. **← end-to-end flow complete (MVP).**
7. **Phase 6 — Multi-breakpoint, variants, voting/decisions.**
8. **Phase 7 — Prototyping (preset transitions) + public share links + comments.**
9. **Phase 8+ — Deferred:** multiplayer, round-trip sync, **Figma import**, code/Storybook
   import, voice commands, custom animation timelines, multi-tenancy/teams.

---

## 16. Open items to resolve before/while building **[OPEN]**

Resolved in this round and folded into the spec: ✅ default breakpoint sizes (§7.3),
✅ single-tenant account model (§3/§15), ✅ preset-only prototype transitions (§13),
✅ proposed-component lifecycle — eng component is the source of truth, manual fix on drift
(§9.3), ✅ Figma import removed from v1 (§9.1, Phase 8+).

Still genuinely undecided:

1. **AI budget ceiling** — monthly spend cap for Claude + transcription, to size caching,
   rate limits, and usage metering. (Owner unsure — even a rough number unblocks the design.)
2. **Timeline & team size** — affects how much of each phase lands per milestone. (Owner unsure.)
3. **Version history depth** — how far back should artboard snapshots / undo persist
   (e.g. last 30 days, or unlimited)? Drives storage and snapshot cadence.

---

_End of v1.0 spec. §16 items are the next conversation._
