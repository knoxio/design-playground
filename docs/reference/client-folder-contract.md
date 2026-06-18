# Client folder contract

The definitive structure of `clients/<client-id>/`. Skills generate it,
discovery globs it, the overlay references into it, handoff exports from it.
Anything not specified here is not part of the contract and tooling must not
depend on it.

Two principles govern the design:

1. **The filesystem is the registry.** Nothing is registered anywhere; adding
   a page, theme, or variant means adding a file in the right place. YAML
   holds only facts that cannot be derived from the tree.
2. **Data files are inert.** Metadata and themes are YAML — they cannot
   contain logic or imports, so they cannot violate boundaries, and plain
   scripts (handoff, promotion lists) read them without a bundler. Everything
   behavioral is TypeScript.

## Structure

```
clients/<client-id>/
├── client.yaml          # identity + default theme — nothing derivable
├── CLAUDE.md            # the brief (see PRD-03); read before any work here
├── themes/
│   ├── default.yaml     # every YAML in here is a theme; id = filename
│   └── <theme-id>.yaml
├── pages/               # the canonical prototype — what demos and handoff use
│   └── <page-id>.tsx
├── components/          # client-specific components (kit wrappers/overrides)
├── data/                # typed mock fixtures (TypeScript)
├── docs/                # client PRD and engagement docs
├── experiments/
│   └── <experiment-id>/
│       ├── experiment.yaml
│       ├── shared/      # code shared between this experiment's variants
│       ├── themes/      # experiment-scoped themes (optional)
│       └── variants/
│           └── <variant-id>/
│               ├── pages/
│               └── themes/  # variant-scoped themes (optional)
└── handoff/             # written only by /handoff runs (script + skill)
```

`<client-id>` is kebab-case and **is** the client's id — there is no id field
to drift out of sync. The same applies to page, theme, experiment, and
variant ids.

## client.yaml

```yaml
name: Marlow Freight
description: Customer portal prototype # optional
defaultTheme: default # names a client theme, or a global one (see Themes)
preview: # optional — client-facing preview deploy access (PRD-08)
  emails: # individual stakeholders (all @helixcollective.com always pass)
    - sarah@marlowfreight.example
  domains: # whole email domains — "anyone at the client company"
    - marlowfreight.example
  # public: true   # explicit opt-out of access control; absent = default-deny
```

The `preview` block is the access list for the client's deployed preview:
adding a stakeholder = add an email (or their whole domain), merge. No
`preview` block means the preview exists but only helix emails pass.

## Themes

A theme is a complete token set — colors, type scale, spacing density,
radii, shadows, numeric variants (schema owned by PRD-02 and validated with
zod on load). Multiple themes exist to compare brand directions. Comments are
welcome and encouraged — theme files should explain themselves.

**Themes are folder-scoped.** A `themes/` folder may exist at four layers,
and a theme is exposed only within its layer's scope:

| Layer      | Location                    | Exposed                            |
| ---------- | --------------------------- | ---------------------------------- |
| Global     | repo-root `themes/`         | every client                       |
| Client     | `clients/<id>/themes/`      | everywhere in that client          |
| Experiment | `experiments/<exp>/themes/` | only while viewing that experiment |
| Variant    | `.../variants/<v>/themes/`  | only while viewing that variant    |

Global themes are the house set (`helix`, `helix-dark`, …) — shared surface,
core-reviewed, outside any client folder. The dock's theme switcher lists
exactly the current scope chain, grouped by layer, with global themes last.
One exception: the design-system galleries (kit, components) are evaluation
surfaces — there the switcher exposes every theme of the client, including
active experiments' and variants', labeled with their owner ("electric ·
Rebrand"), so any theme can be judged against the kit without visiting its
scope.
A rebrand experiment carries its own theme without polluting the client's
theme list; when the experiment is archived, its theme goes with it.
`client.yaml`'s `defaultTheme` names a client-scope theme, or a global one
(useful before a client is branded); `experiment.yaml` may name a `theme`
(resolved own scope → client → global) that applies by default while viewing
that experiment.

```yaml
colors:
  primary: "#1B2A4A" # navy, from their brand PDF p.4
  accent: "#F59E0B"
density: compact # "more terminal than brochure" — kickoff
```

## Pages

Each `pages/<page-id>.tsx` default-exports a React component and exports
colocated metadata:

```tsx
import type { PageMeta } from "@helix/ui";

export const meta: PageMeta = { title: "Dashboard", order: 1 };

// optional named states (ADR-0011) — each deep-linkable via ?state=<name>
export const states = {
  empty: () => <Dashboard rows={[]} />,
  error: () => <Dashboard error="Network timeout" />,
};

export default function Dashboard() { ... }
```

- The filename is the route segment; `home.tsx` is the client's index page.
- Navigation is ordered by `meta.order`, then alphabetically.
- There is no page list anywhere — discovery globs `pages/*.tsx`.
- A page is a **file or a folder** (ADR-0010): `pages/dashboard.tsx` is a single
  screen; `pages/request-quote/` is a flow of ordered step files
  (`pages/request-quote/<step>.tsx`, ordered by `meta.order` then filename). A
  flow is one level deep — a step is never itself a folder.

## Components

Client-specific components — wrappers and overrides built on `@helix/ui` —
live in `components/`, one file per component. Two optional exports
integrate them with the playground:

```tsx
export const promoteCandidate = true; // why: every client lists statuses

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) { ... }

export function demo() {
  return <InvoiceStatusBadge status="paid" />;
}
```

- `demo` — a zero-prop preview rendered by the client's Components gallery
  (`/c/<id>/components`). Without it the component is listed name-only.
- `promoteCandidate = true` — flags the component as a candidate for
  promotion into the shared kit, with the _why_ as a trailing comment.
  Candidates are badged in the gallery and listed by
  `pnpm promotion-candidates`. Promotion itself remains a deliberate,
  core-owner-reviewed PR — the flag is a queue, not an action.

**Component scope ladder** (mirrors theme scoping, enforced by imports and
the boundary rules rather than a runtime picker): kit (global, in
`packages/ui`) → client `components/` → `experiments/<e>/shared/` (across
that experiment's variants) → beside a variant's pages (that variant only).
Search wider scopes before creating at a narrower one; create at the
narrowest scope that needs the component. Graduation moves things up the
ladder: deciding an experiment relocates `shared/` code Main now needs into
`components/`; `/promote-component` moves client components into the kit.

## Experiments and variants

An **experiment is a question**; a **variant is a competing answer**. The
decision is scoped to the experiment, so "chosen" is always chosen _from_
an explicit set.

```yaml
# experiments/quote-flow/experiment.yaml
name: Quote flow
question: Single dense form, or a guided wizard?
status: active # active | decided | archived
page: new-quote # required — the page-tree node this experiment explores
theme: electric # optional — scoped default while viewing this experiment
variants: # optional display names; the folders are the truth
  juniper: Dense form
  banksia: Guided wizard
```

- Variants are discovered from `variants/*/`; `experiment.yaml` may annotate
  them with display names but never defines them. Neutral codenames
  (`juniper`, `banksia`) are deliberate — they stop clients anchoring on
  whichever option sounds newer. Descriptive names are equally valid; Mary's
  call per engagement.
- An experiment **always** has `variants/`, even with a single entry. One
  shape, no special cases.
- `page:` (required) names the page-tree node the experiment explores. It
  resolves against Main pages and the pages the experiment's own variants
  introduce, so an experiment may explore a page that exists only for it. At
  most one active experiment may attach to a given lineage (ADR-0012).
- **Main** is the client's canonical prototype: the contents of the client's
  `pages/`, with no experiment overlaid. It is what demos default to, what
  handoff exports, and what a decided experiment merges into.
- **Page relationships are filename-derived, never declared.**
  `experiment.yaml` carries metadata only — it never lists or maps pages.
  A variant page file relates to Main purely by name:
  - **Override** — `variants/<v>/pages/quotes.tsx` matches `pages/quotes.tsx`:
    full file replacement when viewing through the variant.
  - **Added** — a variant page with no Main counterpart (a wizard step, an
    onboarding screen): exists only inside the variant. The UI's "Main"
    option is disabled on such pages — there is no baseline to compare.
  - **Fall-through** — every Main page the variant doesn't name renders
    unchanged in the variant view, so the variant view is always a complete,
    demoable app.
    Line-level diffs/patches are never stored. "Make the variant override the
    quotes page" means _create the file with that name_ — nothing to register,
    nothing to drift.
- Code shared between variants of one experiment lives in the experiment's
  `shared/`. Code shared beyond one experiment belongs in `components/` (or
  is a kit-promotion candidate).

### Decision (graduation)

Deciding an experiment is a merge, not a flag:

1. The chosen variant's pages are copied into the client's main `pages/`
   (replacing what they overrode, adding what they introduced).
2. If `experiment.yaml` declares a `theme` that lives in the experiment's
   (or winning variant's) own scope, that theme file **moves into the
   client's `themes/`** — Main now embodies that direction, so its theme
   outlives the experiment. Undeclared exploration themes stay behind with
   the experiment. A filename collision with an existing client theme stops
   the graduation for a human decision.
3. `experiment.yaml` gets `status: decided`, `chosen: <variant-id>`,
   `decided: <date>`, and a one-line `rationale`.
4. Losing variants stay in git, untouched.

```yaml
status: decided
chosen: banksia
decided: 2026-06-20
rationale: Ops and MD aligned on the wizard after the week-2 review.
```

Main `pages/` is therefore always the single canonical prototype: demos
default to it, handoff exports it, and nothing is ever "main plus a stack of
chosen overlays." `archived` is for experiments closed _without_ a decision;
both `decided` and `archived` experiments disappear from navigation but never
from git.

## Data

- Fixtures are TypeScript modules in `data/` — typed, importable, no network.
- Plausible but obviously fictional: no real company names, no PII. Mock data
  ships in client-facing previews.

## Validation and failure

Every YAML is validated against its zod schema at discovery time. A malformed
file degrades to an error card naming the file and the violation; it never
white-screens the app, and other clients are unaffected.

## What may reference what

Unchanged from the root rules, restated for this folder's perspective: client
code imports `@helix/ui` and its own client folder, nothing else. The YAML
files can't import anything, by construction — that is part of why they are
YAML.

## Flows, states, and addressing

Pages are **files or folders**: a folder is a flow of ordered step files, and
any page or step can declare named **states** (empty, error, loading, …) as a
colocated `states` export. Every reviewable surface has one canonical address —
`/c/<client>/[x/<exp>/<variant>/]p/<page>[/<step>][?state=<state>][#<anchor>]` —
that routing, navigation, and comment anchoring all agree on. The full design is
in [`prd-10`](../prds/prd-10-flows-and-states.md); the governing decisions are
[ADR 0010](../adr/0010-pages-are-files-or-folders.md),
[0011](../adr/0011-states-as-colocated-exports.md), and
[0013](../adr/0013-canonical-addressing-scheme.md).
