---
name: new-experiment
description: Create an experiment with variants for a client, per the folder contract. Use when asked to start an experiment, explore competing design directions, or try a variant of a flow.
---

# New experiment

Create `clients/<client>/experiments/<experiment-id>/` exactly per
`docs/reference/client-folder-contract.md`.

## Inputs

- **client** (required): existing client id.
- **experiment id** (required): kebab-case, named for the question being
  explored (`quote-flow`), not a solution. Must not already exist.
- **name + question** (required): the human name and the one-line question
  this experiment answers. If the user hasn't framed a question, ask — an
  experiment without a question is just a folder.
- **page** (required): the page-tree node this experiment explores (a page id).
  Every experiment belongs to a page. Use an existing Main page id when the
  experiment redesigns that screen; use a new id when the experiment introduces
  a page that lives only in its variants (each variant then provides
  `pages/<page>.tsx`). At most one active experiment may attach to a given page
  (ADR-0012) — discovery rejects a second.
- **variants** (default: one variant `v1`): id list, optionally with display
  names. For contested directions suggest neutral codenames (`juniper`,
  `banksia`) so the client can't anchor on a loaded name.
- **seed pages** (optional): names of main pages to copy into each variant
  as the starting point ("build both directions from the current state").

## Steps

1. Read the client's `CLAUDE.md` brief and `docs/reference/client-folder-contract.md`
   if not already in context.
2. Create `experiments/<id>/experiment.yaml`:

   ```yaml
   name: <Name>
   question: <the question>
   status: active
   page: <page-id>
   variants:
     <variant-id>: <Display name>
   ```

3. Create `variants/<v>/pages/` per variant (empty `pages/` needs a
   `.gitkeep`). When seeding from main pages, copy the file and **fix
   relative imports** — a page moving from `pages/x.tsx` to
   `experiments/<e>/variants/<v>/pages/x.tsx` is four directories deeper
   (`../data/...` becomes `../../../../../data/...`). Then immediately
   differentiate each seeded variant toward its stated direction — two
   identical copies answer no question; a rough first take of each
   direction is the point of seeding.
4. Remember the page-relationship rules: same filename as a main page =
   override; new filename = variant-only addition (the dock's Main option
   will be disabled there). Never write a pages list into the YAML.
5. If the experiment explores a brand direction, its theme belongs in
   `experiments/<id>/themes/` (narrowest scope), optionally declared as
   `theme: <id>` in `experiment.yaml` to apply by default in that
   experiment.
6. Run `pnpm lint && pnpm format:dir clients/<client> && pnpm typecheck && pnpm boundaries`.
   Must pass with zero manual fixes.
7. Commit (one commit per skill operation — the decide-experiment drift
   check depends on the experiment having a commit history).

## Rules

- Never write outside `clients/<client>/`.
- Mock data stays in the client's `data/` — typed, fictional, no network.
- Shared code between this experiment's variants goes in
  `experiments/<id>/shared/`, not copied per variant.
