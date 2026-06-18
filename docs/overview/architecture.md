# Architecture

The Helix Playground is a Vite + React single-page app that wraps thin tooling
around Claude Code. A designer builds interactive client prototypes by talking
to Claude and interacting with the running prototype; Helix engineers later
rebuild the real application in its own repo from the PRD, the prototype, and
the exported token file. The prototype is reference, never the shipping
artifact.

The decisions behind this shape are recorded in `../adr/`; the buildable
chunks are specified in `../prds/`; the exact client folder structure is in
`../reference/client-folder-contract.md`. This document is the map.

## One application, clients as folders

Everything lives in one repo on `main` — no repo per client. Cross-client
reuse stays possible, there is no template drift, and handoff only ever needs a
client folder plus its token file, because the real product lives in the
engineers' repo regardless (see [`0001`](../adr/0001-one-app-clients-as-folders.md)).

```
hx-playground/
├── app/            playground core: shell, routing, registry, theming, overlay   (protected)
├── packages/ui/    @helix/ui — the shared, token-driven component kit             (protected)
├── themes/         global themes (helix, helix-dark, …), available to every client (protected)
├── functions/      the feedback thread API (Cloudflare Pages Function over D1)
├── infra/          Terraform: Pages, Access, Worker + D1, R2 state
├── clients/<id>/   one folder per client — the full contract
└── docs/           this documentation set
```

**The filesystem is the registry.** Clients, pages, themes, experiments, and
variants are discovered by convention — adding one means adding a file in the
right place, with nothing registered anywhere. YAML holds only the facts that
cannot be derived from the tree, and is inert by construction: no logic, no
imports, so an entire class of boundary violation is impossible rather than
merely forbidden (see [`0002`](../adr/0002-filesystem-is-the-registry.md)).

## Boundaries and the quality gate

Four module boundaries are enforced in CI (see
[`0003`](../adr/0003-module-boundary-rules.md)):

1. `clients/**`-only changes never touch `app/` or `packages/ui/`.
2. No client imports from another client.
3. The shared kit imports nothing from `app/` or any client.
4. Clients import only `@helix/ui`; `app/src/registry/` is the single
   sanctioned door from the app into client code.

A client's needs are met by wrapping or overriding inside its own folder;
moving a component into the shared kit is a deliberate, separately reviewed PR
(see [`0004`](../adr/0004-shared-kit-mutation-rule.md)).

The whole gate is one command, `pnpm run ci`: lint (including agent-sized
complexity and file-size limits), format check, boundaries, typecheck, the unit
and worker test suites, the production build, and the scoped-build leak check.
The same command runs locally, in the husky pre-push hook, and in CI, so green
locally means green in CI. Browser end-to-end tests run as a separate
path-filtered CI job, kept out of the pre-push replay (see
[`0009`](../adr/0009-automated-testing-layers.md) and
[`0015`](../adr/0015-e2e-outside-pre-push-gate.md)). PRs touching only
`clients/**` merge on green; anything touching `app/`, `packages/ui/`, or root
config requires review.

## Design systems and theming

A theme is a complete token set — colors, type scale, density, radii, shadows,
numeric variants — authored as one YAML file and applied at runtime as scoped
CSS variables. Themes exist at four layers (global, client, experiment,
variant) and are exposed only within their scope (see
[`0005`](../adr/0005-folder-scoped-themes.md)). The variable block lands on the
prototype canvas only; the playground chrome is Helix-branded and never
restyled by a client theme. Handoff exports a client's tokens as a W3C DTCG
document. Full detail: [`prd-02`](../prds/prd-02-design-system-theming.md).

## Prototypes, experiments, and flows

A client's `pages/` is its canonical prototype ("Main"). An **experiment** is a
question; its **variants** are competing answers, each a set of pages that
override Main by filename. Deciding an experiment merges the chosen variant's
pages into Main and records the rationale — graduation is a merge, not a flag
(see [`0006`](../adr/0006-experiments-variants-graduation.md)).

A page is a single screen (a file) or a **flow** of ordered steps (a folder);
each screen can declare named **states** (empty, error, loading, …) as a
colocated export. Every reviewable surface — design × page × step × state —
has one canonical address, which the comment overlay anchors to (see
[`0010`](../adr/0010-pages-are-files-or-folders.md),
[`0011`](../adr/0011-states-as-colocated-exports.md),
[`0013`](../adr/0013-canonical-addressing-scheme.md), and
[`prd-10`](../prds/prd-10-flows-and-states.md)).

## The overlay and feedback loop

One Figma-style comment overlay works on every surface: click an element (or the
whole page), leave a note, and it becomes a status-tracked thread anchored to
that spot. Threads live in a single Cloudflare D1 database behind same-origin
`/api/*` Pages Functions, so each surface's own Access app is the auth. The
`hx-feedback` MCP server exposes the same threads to Claude sessions, and a
clipboard payload is the offline path. The loop's engine is the designer's
Claude session — nothing in it is metered (see
[`prd-05`](../prds/prd-05-overlay-feedback.md) and
[`0017`](../adr/0017-feedback-engine-is-claude-session.md)).

## Previews, deployment, and confidentiality

Hosting is Cloudflare — Pages, Access, the feedback Worker + D1, all managed by
Terraform from the repo (see [`0016`](../adr/0016-cloudflare-stack.md)). Merging
to `main` deploys every surface. The internal app holds every client behind
Access for any `@helixcollective.com` email. A client-facing preview is never
the internal app with a route guard: a per-client build filters the registry at
build time so the deploy physically contains only that client's folder, and a
CI check proves no other client leaked (see
[`0007`](../adr/0007-scoped-previews-physical-exclusion.md)). Preview access
comes from `client.yaml`'s `preview` list, default-deny (see
[`0008`](../adr/0008-access-based-confidentiality.md)). Every preview carries a
visible PROTOTYPE banner, and the handoff package declares what is real versus
mocked.

## A non-coder driving Claude Code

The designer never edits code; all authoring happens through Claude Code
sessions and direct interaction with the running prototype (see
[`0014`](../adr/0014-claude-only-authoring.md)). Recurring operations are
pre-built skills (`../reference/skills.md`) so output quality does not depend on
prompting. Anything deterministic — scaffolds, exports, inventories — is a
`pnpm` script a human can run without Claude; skills drive the scripts and own
only the judgment. The root `CLAUDE.md` carries the rules Claude enforces on the
designer's behalf: the boundary rules, the shared-kit mutation rule, and file
placement conventions.
