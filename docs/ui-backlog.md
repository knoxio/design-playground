# UI backlog — design-system surfaces

Improvement ideas for the playground's design-system UI, each with the
trigger that makes it worth building. Nothing here is committed work; PRDs
own scope. When one of these gets picked up, fold it into the owning PRD.

## Shipped from this backlog (2026-06-11)

Token specimens with values (kit gallery is now a copyable spec sheet:
colors with variables + values, type scale table with sizes/line-heights/
classes, weights row, spacing bars from the density base unit, radii and
shadow values), the `CopyButton` with success state (consumers: token
values and the overlay's Copy-for-Claude payload), and the theme-failure badge on the
dock's theme tool (red dot + error tooltip when any theme in scope failed
validation). Also shipped: kit manifest categories (the ~10-component
trigger hit when the kit grew to 18 — gallery now groups by category with
counts), the icon library (Lucide via `@design/ui/icons`, searchable
click-to-copy browser at `/icons` and per client), the first-session
orientation card on the overview (dismissible, reopenable from "How this
works"), and the threads tool on the dock (client feedback threads with
reply + status controls; hides itself where the feedback API is absent).

## Soon (cheap, high value)

### Counts and empty states everywhere

Galleries and lists should count what they show ("12 components", "3 of 7
experiments" when filtered) and design their empty/no-results states instead
of rendering blankness. Cheap polish that makes the app feel maintained.

## When the trigger hits

### Component staging metadata (status / owner / date)

Client components currently carry a boolean `promoteCandidate`. The natural
evolution is a `componentMeta` export — `status: draft | review | approved`,
`owner`, `since`, `note` — rendered as colored pills in the Components
gallery, with `pnpm promotion-candidates` reading the same metadata. Makes
the idea→kit pipeline visible. **Trigger:** the first real promotion review,
when "candidate" stops being binary.

### Experiment cards with filters

A card browser for experiments (title, question, status, date, tags) with
search and filter dropdowns, plus "X of Y" counts. The sidebar list is right
for 2–3 experiments per client; cards earn their place when a client
accumulates many. **Trigger:** first engagement with >5 experiments. Needs
optional `tags`/`owner` in `experiment.yaml` — a contract change, made
deliberately.

### Theme evaluation page (richer than the dock)

The dock panel is the quick switch. A `/c/<id>/themes` page would be where
Mary _evaluates_: one card per theme with a mini palette, a live preview
block (buttons/inputs/cards under that theme without leaving the page), and
an active-tokens readout (swatch + label + variable + value grid).
**Trigger:** first multi-theme brand exploration with a client in the room.
Overlaps with the kit gallery — possibly one page, two routes.

## Light touches, when the sidebar gets busier

- Colored dot badges per nav group and a subtle active-item border accent.
- Sidebar footer with totals (pages, experiments, components).
- Non-demoable kit components: a manifest flag + a listed-with-reason
  section in the gallery, instead of silently missing — the gallery should
  be exhaustive even where it can't render.
