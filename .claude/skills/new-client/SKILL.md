---
name: new-client
description: Scaffold a new client folder per the client folder contract. Use when asked to create, add, or onboard a new client in the playground.
---

# New client

Scaffold `clients/<id>/` exactly per `docs/reference/client-folder-contract.md`.

## Inputs

- **id** (required): kebab-case, becomes the folder name and the client id.
  Validate: lowercase letters, digits, hyphens; must not already exist.
- **name** (required): display name for `client.yaml`.
- **source client** (optional): an existing client whose default theme is
  copied as the starting point. Default: copy the global standard,
  `themes/design.yaml`.

## Steps

1. Read `docs/reference/client-folder-contract.md` if not already in context.
2. Run the deterministic scaffold: `pnpm new-client <id> "<Display Name>"`
   (mechanics in `scripts/new-client.mjs`, covered by
   `scripts/new-client.test.mjs`). It writes exactly the files below, seeding
   the default theme from the Design standard. Then apply judgment — fill the
   brief from the kickoff and tune `clients/<id>/themes/default.yaml` toward the
   client's direction. The files it creates — nothing outside `clients/<id>/`:
   - `clients/<id>/client.yaml` — `name`, optional `description`,
     `defaultTheme: default`.
   - `clients/<id>/themes/default.yaml` — forked from the source client's
     default theme or the Design standard. Keep/add comments explaining
     choices.
   - `clients/<id>/CLAUDE.md` — the brief template below.
   - `clients/<id>/pages/home.tsx` — minimal page: kit imports only,
     `meta` export with `{ title: "Home", order: 1 }`, default export.
   - `clients/<id>/components/`, `clients/<id>/data/`, and
     `clients/<id>/docs/` (empty dirs need `.gitkeep` to survive git).
3. Run `pnpm lint && pnpm format:dir clients/<client> && pnpm typecheck && pnpm boundaries`.
   The scaffold must pass with zero manual fixes.
4. If a dev server is available, confirm the client appears on the
   overview; otherwise the checks above suffice.
5. Commit the scaffold (one commit per skill operation — see CLAUDE.md).

## Brief template (`clients/<id>/CLAUDE.md`)

```markdown
# <Name> — Client Brief

> Generated from the kickoff transcript where possible; keep current as the
> engagement evolves. Read before any prototyping work for this client.

## Who they are

TODO

## The problem

TODO

## Agreed scope

- TODO

## Out of scope

- TODO

## Design system decisions

- TODO — see `themes/default.yaml`

## Vocabulary

- TODO (terms to use / terms to avoid)

## Key people

- TODO

## Open questions

- TODO

## Decision log

(append-only; one line per decided experiment)
```

## Rules

- Never write outside `clients/<id>/`.
- Never touch `app/`, `packages/`, or root config — if the scaffold seems to
  need it, stop and say so instead.
- No real client data in mock fixtures.
