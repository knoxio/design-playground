# For developers

This is the orientation for the playground's core owner — the engineer who
maintains `app/`, the shared kit, themes, the CI gate, and the deploy
infrastructure. It is a map and a set of norms, not an exhaustive rule dump; the
authoritative details live in the linked references and the root `CLAUDE.md`.

The designer (see [`for-designers.md`](for-designers.md)) never touches code and
works only inside `clients/`. Your job is to keep the surfaces she builds on
sound and to guard the boundaries that let her changes merge without you in the
loop.

## Architecture at a glance

A single Vite + React SPA on one `main` branch. There is no repo-per-client. The
codebase is the document model, git is persistence, preview deploys are the
share links, and **the filesystem is the registry** — clients, pages, themes,
experiments, and variants are discovered by convention, never registered. The
discovery code (`app/src/registry/`) parses YAML and page modules against Zod
schemas and emits typed entries plus an `errors[]` array; a malformed file
degrades to an error card naming the file, never a white screen.

For the full picture and the worked engagement, read
[`../overview/architecture.md`](../overview/architecture.md). Structural terms
are defined in [`../reference/client-folder-contract.md`](../reference/client-folder-contract.md)
— that contract is the API every skill, PRD, and bit of discovery code programs
against. Internalize it; most of your reviews come down to "does this respect
the contract."

## What is protected, and the boundary rules

Three areas are **protected** — owned by `@helix-collective/dev` via CODEOWNERS,
changed only through reviewed PRs:

| Path           | What                                                                  |
| -------------- | --------------------------------------------------------------------- |
| `app/`         | Playground core: shell, routing, registry, theming, overlay           |
| `packages/ui/` | `@helix/ui`, the shared component kit (token-driven, client-agnostic) |
| `themes/`      | Global house themes (`helix`, `helix-dark`, …)                        |

Four import-boundary rules are enforced in CI (dependency-cruiser plus path
checks), not by convention:

1. `packages/ui` never imports from `clients/` or `app/`.
2. No client imports from another client.
3. Clients never import app internals — only `@helix/ui`.
4. Only `app/src/registry/` imports client code (the single sanctioned door from
   app to client).

A separate, critical rule the boundary checker _cannot_ catch (it watches import
direction, not edits): **never modify a kit component to satisfy one client.**
The failure sequence is Mary needs Button to differ for client X → Claude
edits the shared Button → every client shifts. Client-specific needs are met by
wrapping or overriding inside that client's `components/`. The root `CLAUDE.md`
encodes this so Claude enforces it during her sessions; you enforce it in review.

## The CI gate

CI is one command, and the same command runs locally and in the husky hooks:

```sh
pnpm run ci
```

It chains: `lint → format:check → boundaries → typecheck → test →
test:functions → build → verify:scoped`. There are no behaviour tests _required_
by the original design philosophy, but the test layer is being built out — see
testing below. The `verify:scoped` step proves a per-client build physically
excludes every other client (no other ids, names, routes, or source stamps leak)
— the guarantee that previews cannot expose client A to client B.

If `pnpm run ci` is green locally, CI is green. Use `pnpm ci:fix` to auto-fix
format and lint issues and then re-run the full gate.

### Agent-sized lint limits

Lint enforces module sizes tuned for an agent editing the code: complexity ≤ 15,
files ≤ 350 lines, functions ≤ 200 lines, nesting depth ≤ 4, params ≤ 5. When a
limit fires, **split the module — never raise the limit for one file.** These
keep files small enough for Claude to edit reliably and for humans to review.

## Tests — running and adding

Runners: **Vitest** for unit and registry/contract tests,
**@cloudflare/vitest-pool-workers** for the feedback worker against an ephemeral
D1, and **Playwright** for browser flows.

```sh
pnpm test            # app unit + registry/contract tests
pnpm test:functions  # the feedback worker (Pages Functions + D1)
pnpm test:e2e        # Playwright browser smoke
```

The highest-value tests cover the registry's `errors[]` array — that array is
the client-folder contract expressed as code, so every violation it can report
is a test case. The full strategy, the layered plan, and the roadmap for
authored per-page "play" interaction tests are in
[`../reference/testing.md`](../reference/testing.md). When you add tests, wire
them into the `ci` chain so the gate stays the single source of truth.

Note Playwright discipline (root `CLAUDE.md` rule 11): rely on auto-waiting, no
long explicit timeouts — a long timeout hides flakiness, it does not fix it.

## The shared kit and the promotion flow

`@helix/ui` is a real internal product with you as its curator. Budget the
curation time, or the kit becomes a junk drawer and everything real ends up in
client folders.

- Every kit component ships a `kitManifest` entry (id, description, demo) in
  `packages/ui/src/gallery.tsx`. The galleries render the manifest, so a
  component without an entry is invisible — adding one without the other is an
  incomplete change.
- Client components flagged with `export const promoteCandidate = true` are
  badged in the client's gallery and listed by `pnpm promotion-candidates`. The
  flag is a queue, not an action.
- Promotion is a deliberate, separately-reviewed PR you own — driven by the
  **`/promote-component`** skill, generalizing the component and adding the kit
  manifest entry. **Never bundle a promotion with client work.** A suggested
  cadence is batched, fortnightly review of the candidate queue.

## Hooks, PRs, and merge norms

- **Husky pre-commit** runs the fast checks (lint, format check, boundaries).
- **Husky pre-push** replays CI _exactly_: it checks out the pushed commit into a
  clean worktree, does a frozen-lockfile install, and runs the full gate there.
  If pre-push passes, the PR never needs a fix-up cycle. **Never bypass the
  hooks** — fix and recommit.
- **Merging is squash-only.** PRs touching only `clients/**` merge on green with
  no human review (enable GitHub auto-merge so green merges itself) — this is
  what lets Mary work without you in the loop. Anything touching `app/`,
  `packages/`, `themes/`, or root config requires `@helix-collective/dev` review
  via CODEOWNERS.
- **Confidentiality:** one client's name, brief, or work never appears in
  another client's folder, nor in `app/` or `packages/ui`. The core stays
  client-agnostic.

## Deploys and ops

Hosting is Cloudflare, managed by Terraform from `infra/`, all within the free
tier at agency scale:

- **Pages** — the internal app plus one project per client preview.
- **Access** — auth. The internal app is open to any `@helixcollective.com`
  email; client previews are default-deny, opened per stakeholder via
  `preview.emails`/`domains` in `client.yaml`.
- **Worker + D1** — the feedback service (threads), behind each surface's own
  Access app so previews are hard-scoped server-side.

Merge to `main` runs the gate, then Terraform (when `infra/` or any
`client.yaml` changed), then the wrangler deploy matrix. A new client folder
becomes a gated preview with no infra edits. Terraform state lives in R2.

The full operational detail — the deploy pipeline, the Access model, the
feedback service internals, infra commands (`pnpm infra:plan`,
`pnpm infra:apply`), and the secret/`.env` setup — is in
[`../reference/operations.md`](../reference/operations.md). The current
capability status and what is built versus planned is tracked alongside the
[roadmap](../roadmap.md) and the PRDs at
[`../prds/`](../prds/prd-01-client-lifecycle.md).

## Where to start as the new owner

1. Read [`../reference/client-folder-contract.md`](../reference/client-folder-contract.md)
   front to back — it is the system's spine.
2. Run `pnpm install && pnpm dev`, then click through the internal app: a
   client, its galleries (`/components`, `/tokens`, `/icons`), an experiment with
   variants, the inspect overlay.
3. Run `pnpm run ci` and read what each stage does.
4. Read one skill end to end (`/decide-experiment` is a good one — it touches the
   contract, git history, and theme scoping) to see how mechanics-in-scripts and
   judgment-in-skills are split.
5. Skim [`../reference/operations.md`](../reference/operations.md) before your
   first deploy.
