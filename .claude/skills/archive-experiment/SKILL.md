---
name: archive-experiment
description: Close an experiment without a decision. Use when an exploration is abandoned, parked, or superseded — nothing merges into Main.
---

# Archive experiment

`archived` means closed **without** a decision — nothing merges, nothing is
deleted. The experiment disappears from navigation and the dock but stays in
git (and its scoped themes stay with it).

## Inputs

- **client**, **experiment** (required).
- **why** (one line, required): ask if not given.

## Steps

1. Validate `experiment.yaml` exists and `status: active`. If the user is
   actually choosing a winner, use `/decide-experiment` instead — point this
   out rather than archiving a decided question.
2. Set `status: archived` in `experiment.yaml`. Touch nothing else.
3. Append to the client `CLAUDE.md` Decision log:
   `- <date>: <experiment name> archived without decision — <why>`
4. Run `pnpm lint && pnpm format:check`. If a dev server is available,
   confirm the experiment left the sidebar. Commit.

## Rules

- Never delete files; archiving is a status change.
- Never write outside `clients/<client>/`.
