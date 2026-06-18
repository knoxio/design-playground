# For designers

This is your guide to building client prototypes in the playground. You never
edit code. You work by talking to a Claude Code session and by clicking around
the prototype as it runs. Claude does the editing; you do the directing.

The recurring operations are pre-built **skills** — you invoke one by typing its
name with a leading slash (for example `/new-client`). You do not need to know
what they do under the hood, only when to reach for each. The full list with a
one-line description of each is in [`../reference/skills.md`](../reference/skills.md);
this guide tells you where each fits in the engagement.

If a term here is unfamiliar (client, theme, experiment, variant, Main), the
[glossary](../overview/glossary.md) defines it plainly.

## How a session works

1. Open the project in Claude Code (your editor opens it; if unsure, ask Claude
   to "open the playground").
2. Start the running prototype with the dev server. If it is not already up,
   tell Claude "start the dev server" — it runs on
   **http://localhost:3003**. Keep that browser tab open beside your chat.
3. You describe what you want in plain language; Claude makes the change; you
   refresh the prototype and react. That loop — describe, look, react — is the
   whole job.

Every change Claude makes is saved as a versioned snapshot (a commit) and goes
through a review step (a pull request) before it becomes official. For your work
on a single client, that review is automatic once the checks pass — you do not
wait on an engineer. If something goes wrong, ask Claude to undo the last change;
nothing is ever lost.

## The engagement loop, end to end

This mirrors the worked example in
[`../overview/architecture.md`](../overview/architecture.md). The steps below
are the order you actually do things.

### 1. Turn the kickoff meeting into a brief

After a client kickoff, you have a recording or notes. Create the client folder
first, then feed in the transcript:

- Run **`/new-client`** to scaffold the client.
- Run **`/brief-from-transcript`** with the transcript. It writes the client
  **brief** (who they are, the agreed scope, their vocabulary, their brand
  adjectives, the open questions) and a first draft of the PRD.

The brief is what makes every later request produce _this client's_ product
instead of generic screens. It is grounded only in what was actually said —
nothing is invented. Read it back; correct anything wrong by telling Claude.

### 2. Attach and tune a design system

A **theme** is the client's look — their colors, type, spacing density, corner
roundness, shadows — captured as a token set. Every shared component renders
through it, so styling one theme restyles the whole prototype consistently.

- Run **`/new-theme`** to create the client's design system, or start from the
  Helix house style and tune it: "Start from the Helix standard but navy
  primary, amber accent, tighter spacing, smaller radius."
- If the client already has a Figma design system or exported tokens, run
  **`/theme-from-figma`** to import it as a theme.
- Judge the theme before any page exists: open the client's **kit gallery**
  (the `/components` page in the running app) — it renders every shared
  component under the client's tokens. Iterate the theme against it.
- To compare brand directions, ask Claude for a couple of alternate themes and
  flip between them live with the **theme switcher** in the dock at the bottom
  of the screen. Keep the winner, ask Claude to delete the rest.

Never ask Claude to change a color directly on a page — that is a smell. Adjust
the theme, and the change applies everywhere it should.

### 3. Build the prototype pages

Describe the screens from the brief and Claude builds them from the shared
component kit plus the client's mock data:

> "Build the dashboard: a table of active consignments, a panel of pending
> quotes, and a quick-action to request a new quote."

- Pages are real, interactive React — routing between them is the flow. There
  are no canned transitions; clicking through is the demo.
- Data is **mock data** — typed, fictional fixtures. No real client data, no
  live APIs. Everything the prototype "does" is an illusion you control.
- Components: Claude searches the shared kit first, then the client's own
  components, and only builds new ones at the narrowest scope that needs them.
  If a new component looks broadly useful across clients, Claude flags it as a
  promotion candidate (an engineer decides later — see
  [`for-developers.md`](for-developers.md)). You do not manage this; just know
  the kit is never bent to fit one client.

Browse what is available in the running app: `/components` for components,
`/icons` for icons, `/tokens` for the design-token spec sheet.

### 4. Run an experiment when a direction is contested

When stakeholders disagree on an approach — say, a dense single form versus a
guided wizard for the same task — do not guess. Make it an **experiment**: the
experiment is the _question_, and each **variant** is a competing _answer_.

- Run **`/new-experiment`** with the question ("Single dense form, or guided
  wizard?"). It creates the experiment with its variants.
- Run **`/new-variant`** to add another answer mid-stream.
- A variant only needs to supply the pages that differ; every other page falls
  through to the client's main pages, so flipping a variant always shows a
  complete, demoable app.
- For contested directions, prefer neutral codenames for variants (the skill
  suggests them) so the client does not anchor on whichever name sounds newer.

Flip between variants live with the **variant switcher** in the dock. Demo them
side by side on a call.

### 5. Review with the client on a preview link

Each client gets its own preview deploy — a private link containing only that
client's work, carrying a visible **PROTOTYPE** banner so nobody mistakes it for
a finished product.

- To grant a stakeholder access, add their email (or their whole company email
  domain) to the client's preview list — just ask Claude to "add
  sarah@client.example to the Marlow preview." It merges and the link lets them
  in.
- The preview redeploys automatically whenever your changes are merged, so the
  client always sees the latest.

### 6. The inspect overlay — pointing at things

The overlay is how you and the client point at the prototype and have that
pointing reach Claude intact. It is the same commenting system on every surface,
Figma-style.

- Press **`i`** to toggle inspect mode (on a preview, use the button in the
  PROTOTYPE banner; in your own app, the dock has a comments button).
- Click any element to pin a comment to it, or comment on the whole page. On the
  token and component galleries you can pin to a specific token or kit
  component.
- Each pin is a **thread** shown as a colored dot; anyone with preview access
  can reply. The dot color tracks the thread's status (open, applied, rejected).
- Threads carry their context automatically: which client, route, theme, and
  viewport they were made on.
- **"Copy for Claude"** exports the threads as a block you can paste into your
  session — the offline path. When the feedback service is connected, you do
  not even need to copy: Claude reads the threads directly.

Clients drop comments right on the elements ("this table needs an ETA column",
"this button should say Book consignment"). You see those same threads in your
own app, and can add your own pinned notes.

### 7. Apply client feedback

When threads have come in:

- Run **`/apply-feedback`** for the client. It pulls the open threads, applies
  each change at the right place, commits, and writes a resolution back onto the
  thread — so the commenter sees both the change and the reply when they
  refresh. If a request cannot or should not be done, it is marked rejected with
  an explanation rather than silently dropped.

A few rounds of this — comment, apply, redeploy — is the iteration loop. No
email, no clipboard juggling.

### 8. Decide an experiment

When the client picks a winning variant:

- Run **`/decide-experiment`** with the winner and a one-line rationale. The
  chosen variant's pages become the client's real (Main) pages, the decision and
  its reasoning are recorded, and the losing variants stay in history untouched.
- After deciding, the experiment leaves the navigation and Main is once again
  the single, canonical prototype.
- If an exploration is abandoned without a winner, run **`/archive-experiment`**
  instead — it closes the experiment without merging anything.

### 9. Hand off to engineers

When the engagement is approved and ready to build for real:

- Run **`/handoff`** for the client. It produces the exit package engineers
  build from: the finalized PRD, the design tokens as a portable file, a
  component inventory, screenshots, and a **real-vs-mocked** declaration — the
  explicit list of what in the prototype is an illusion (mock data, no real
  auth, instant fake responses). Engineers rebuild the real application in their
  own repo from this; the prototype itself is reference, never shipped.

During the later support period, the client folder is still there — brief,
themes, pages, decisions — as the living reference. New change requests get
prototyped here first, the same way.

## Habits that keep things clean

- **One operation, one commit.** After a skill finishes, let it commit before
  starting the next thing. Later operations rely on that history.
- **Keep the brief current.** When scope or a design decision changes, ask
  Claude to update the client's brief. It steers every future session.
- **Adjust themes, not pages, for styling.** A hardcoded color on a page is a
  smell; the fix is in the theme.
- **Trust the undo.** If a change went sideways, ask Claude to discard it. You
  are never one wrong prompt away from a broken repo.
