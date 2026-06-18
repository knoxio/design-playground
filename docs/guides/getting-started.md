# Getting started

Onboarding for anyone picking up the Design Playground — a designer returning to
build prototypes, or a developer taking over the core. It covers cloning the
repo, the one-time machine setup, and where to go next.

The playground is a Vite + React single-page app that wraps thin tooling around
a Claude Code session. The codebase is the document model, git is the history,
and the filesystem is the registry — a client, page, theme, or experiment
exists because a file sits in the right place. For the full picture see
[`../overview/architecture.md`](../overview/architecture.md); for the vocabulary
see [`../overview/glossary.md`](../overview/glossary.md).

## Prerequisites

- **Node 24+** (the repo pins a version in `.nvmrc`; run `nvm use` if you use
  nvm).
- **pnpm** — the package manager (`packageManager` in `package.json` pins the
  exact version; `corepack enable` will install it).
- **Git** and a GitHub account with write access to `knoxio/design-playground`.
- **Claude Code** — the playground is driven from a Claude Code session opened
  in the repo. This is the editing surface; nobody edits prototype files by hand.

## Clone and install

```sh
git clone git@github.com:knoxio/design-playground.git
cd design-playground
pnpm install
pnpm dev          # dev server on http://localhost:3003
```

That gives you a working app with every client, theme, and experiment
discovered from the filesystem. Open `http://localhost:3003`. Useful keys once
it is running: `i` toggles inspect mode (pin feedback on any element), and the
dock at bottom-center switches themes, experiment variants, and viewport sizes.

## One-time machine setup: the feedback service

The comment overlay talks to a feedback service (Cloudflare Pages Functions
backed by a shared D1 database, behind Cloudflare Access). Locally, the dev
server proxies `/api/*` to that deployed service, and the `design-feedback` MCP
server exposes the same threads to your Claude Code session. Both need one
secret: a Cloudflare Access **service token**.

1. Copy the template:

   ```sh
   cp .env.example .env
   ```

2. Fill in the three values in `.env` (it is gitignored — never commit it):
   - `CF_ACCESS_CLIENT_ID`
   - `CF_ACCESS_CLIENT_SECRET`
   - `DP_FEEDBACK_URL` — the deployed feedback API base (the default in
     `.env.example` is correct for the shared deploy)

   The service token is created in Cloudflare Zero Trust → Access → Service
   tokens. If a deployment already exists, get the values from whoever operates
   it (your team's secrets manager) rather than minting ad-hoc ones; the values
   are never stored in this repo. Standing up your own deployment from scratch?
   See [cloudflare-setup.md](cloudflare-setup.md).

3. The `design-feedback` MCP server is already registered in `.mcp.json`. It loads
   when a Claude Code session starts in this repo; approve it once when
   prompted. With the `.env` in place, the threads tool works on localhost and
   the live comment overlay appears.

Without a `.env`, nothing breaks: the comment overlay quietly disables and the
clipboard "Copy for Claude" export becomes the fallback path. You can build
prototypes fully without it — you only lose the live thread loop.

### The "let Claude set it up" path

The normal path is to open Claude Code in the repo and tell it to set this up:
it walks the `.env` copy, points you at wherever your credentials are kept, runs
`pnpm install`, and starts the dev server. You still supply the secret values
yourself — Claude never invents credentials.

## Verify your setup

Run the full CI gate locally. It is the same command CI runs, so if it passes
locally it passes on CI:

```sh
pnpm run ci
```

This runs lint, format check, module-boundary check, typecheck, tests, build,
and the scoped-build leak check. If it is green, your checkout is healthy.

## Your first task

- **You build prototypes (designer):** go to
  [`for-designers.md`](for-designers.md). You will start a Claude Code session,
  create a client, attach a design system, and build pages by describing them.
- **You own the core (developer):** go to
  [`for-developers.md`](for-developers.md). It covers the protected areas, the
  boundary rules, the CI gate, the shared kit, and deploys.

Both should skim the end-to-end engagement in
[`../overview/architecture.md`](../overview/architecture.md) and the recurring
operations in [`../reference/skills.md`](../reference/skills.md).

## Push authentication note

Pushes authenticate through the GitHub CLI's active account, which has push
access to the repo. The `origin` URL carries no embedded username, so git uses
whichever account `gh` has active — keep it on the account with repo access
(`gh auth switch` if needed). Commit author identity is set separately in the
repo's git config and is independent of the push account. An unexpected 404 on
push usually means the wrong `gh` account is active.
