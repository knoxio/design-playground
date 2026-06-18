# Helix Playground

A prototyping playground for Helix client engagements. A designer builds
interactive, client-branded prototypes here through Claude Code — no direct
code editing — and walks clients through them live or via deployed previews.
Engineers later rebuild the real product from the handoff package (PRD +
prototype + tokens); the prototype itself is reference, never shipped.

The design: thin tooling wrapped around an agentic coding session. The
codebase is the document model, git is persistence, and the filesystem is
the registry — a client, page, theme, or experiment exists because a file
sits in the right place, not because anything was registered.

## Quickstart

```sh
pnpm install
pnpm dev        # http://localhost:3003
```

Useful keys once it's running: `i` toggles inspect mode (pin feedback on any
element), the dock at bottom-center switches themes and experiment variants.

## Repo map

| Path             | What                                                            | Protected |
| ---------------- | --------------------------------------------------------------- | --------- |
| `app/`           | Playground core: shell, routing, registry, theming              | yes       |
| `packages/ui/`   | `@helix/ui` — the shared component kit, token-driven            | yes       |
| `themes/`        | Global themes available to every client (`helix`, `helix-dark`) | yes       |
| `clients/<id>/`  | One folder per client: brief, themes, pages, experiments, data  | no        |
| `docs/`          | Guides, the folder contract, PRDs, ADRs, roadmap                | yes       |
| `.claude/skills` | The operations layer (create/decide/archive/apply-feedback/…)   | yes       |

"Protected" paths are owned by `@helix-collective/dev` via CODEOWNERS and
require review; PRs touching only `clients/**` merge on green automatically.

## Core concepts

- **Clients** — `clients/<id>/` per the contract in
  `docs/reference/client-folder-contract.md`. The `CLAUDE.md` inside is the client
  brief (scope, vocabulary, brand); it steers every session for that client.
- **Themes** — YAML token sets (colors, type, density, radii, shadows),
  scoped by folder: global → client → experiment → variant. Themes apply as
  CSS variables on the prototype canvas only; the chrome stays Helix-branded
  and isolated. Spec sheet at `/tokens`, validated with zod, malformed files
  degrade to error cards.
- **Experiments & variants** — an experiment is a question
  (`experiment.yaml`), its variants are the competing answers. A variant's
  pages override main pages by relative path; everything else falls through,
  so flipping variants always shows a complete app. Deciding an experiment
  merges the winner's pages into main and records the rationale; losers stay
  in git.
- **Components** — search the kit first (`/components`, manifest-driven),
  then the client's `components/`. New components go at the narrowest scope
  that needs them; promotion into the kit is a separate, reviewed PR. The
  kit is never modified to satisfy one client.
- **Mock data** — typed fixtures in `clients/<id>/data/`. Fictional, no API
  calls, no real client data.

## The working loop

Operations are encoded as skills in `.claude/skills/` — `/new-client`,
`/new-theme`, `/new-experiment`, `/new-variant`, `/decide-experiment`,
`/archive-experiment`, `/brief-from-transcript`, `/theme-from-figma`,
`/promote-component`, `/apply-feedback`, `/handoff`. One operation, one
commit.

Feedback is one commenting system, Figma-style, on every surface: press
`i` (or the dock button; the PROTOTYPE banner button on previews), click
any element — or comment on the whole page — and discuss it in threads.
Threads persist in the feedback service (D1, behind Cloudflare Access)
with status-colored dots on their elements. `/apply-feedback` reads them
through the `hx-feedback` MCP server (or a pasted "Copy for Claude"
export), applies each at the anchored source, and writes the resolution
back where the commenter sees it.

One-time machine setup for the feedback service: copy `.env.example` to
`.env` and fill in a Cloudflare Access service token (Zero Trust → Access →
Service tokens). That single `.env` powers everything local — the
`hx-feedback` MCP server (registered in `.mcp.json`; it loads when a
session starts in this repo, approve it once when prompted) and the dev
server's `/api` proxy, which is what gives localhost the live comment
overlay. No token, no service: comments quietly disable and the clipboard
export is the fallback.

## Commands

| Command                       | What                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `pnpm dev`                    | Dev server on :3003                                                                      |
| `pnpm run ci`                 | The full gate: lint, format check, boundaries, typecheck, build, scoped-build leak check |
| `pnpm ci:fix`                 | Auto-fix what's fixable, then run the full gate                                          |
| `pnpm boundaries`             | Dependency-cruiser boundary check                                                        |
| `pnpm promotion-candidates`   | List client components flagged for kit promotion                                         |
| `pnpm handoff <client>`       | Mechanical handoff artifacts (tokens, inventory, screens)                                |
| `pnpm a11y <client>`          | On-demand WCAG 2.2 AA audit — scores, never blocks                                       |
| `VITE_CLIENT=<id> pnpm build` | Scoped preview build for one client                                                      |

## Guardrails

- **Boundaries (CI-enforced):** `packages/ui` never imports clients or app;
  clients never import each other or app internals; only `app/src/registry/`
  imports client code.
- **Hooks:** pre-commit runs the fast checks; pre-push replays CI exactly —
  it checks out the pushed commit into a clean worktree, does a
  frozen-lockfile install, and runs the full gate there. If pre-push passes,
  CI passes. Never bypass hooks.
- **Merging:** squash-only. `clients/**`-only PRs auto-merge on green;
  anything else waits for `@helix-collective/dev` review.
- **Lint limits are agent-sized** (complexity ≤ 15, files ≤ 350 lines,
  functions ≤ 200): when one fires, split the module — never raise the limit.
- **Confidentiality:** one client's name or work never appears in another
  client's folder, nor in `app/` or `packages/ui`.

## Documentation

Start at [`docs/README.md`](docs/README.md). Key entries:

- `docs/overview/architecture.md` — product and architecture rationale
- `docs/guides/` — getting started, for designers, for developers
- `docs/reference/client-folder-contract.md` — the contract everything programs against
- `docs/reference/skills.md` — the skill registry
- `docs/prds/` — one PRD per capability, describing the target product
- `docs/adr/` — architecture decision records
- `docs/roadmap.md` — what's built vs planned
- `docs/walkthrough.md` — a full engagement, end to end
