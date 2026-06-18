---
name: new-variant
description: Add a variant to an existing active experiment — a new competing answer, forked from a sibling variant, seeded from Main, or empty. Use when a new direction emerges mid-experiment.
---

# New variant

Add `variants/<variant-id>/` to an existing experiment, per
`docs/reference/client-folder-contract.md`.

## Inputs

- **client**, **experiment** (required; experiment must be `status: active` —
  decided/archived experiments don't grow variants, start a new experiment
  instead).
- **variant id** (required, kebab-case) + display name. Match the
  experiment's existing naming style (neutral codenames stay neutral).
- **source** (required, ask if unclear):
  - `fork <sibling-variant>` — copy that variant's `pages/` (same depth, no
    import fixing needed)
  - `seed <main-page>...` — copy named Main pages (**fix relative imports**:
    four directories deeper, `../data/...` → `../../../../../data/...`)
  - `empty` — just the folder

## Steps

1. Validate experiment exists and is active; variant id doesn't already exist.
2. Create `variants/<id>/pages/` with the source content.
3. Add the display name to `experiment.yaml`'s `variants:` map.
4. Run `pnpm lint && pnpm format:dir clients/<client> && pnpm typecheck && pnpm boundaries`.
5. If forked from a sibling, immediately differentiate it toward its
   stated direction — a byte-identical fork answers no question.
6. If a dev server is available, confirm the new variant appears in the
   dock's panel (and the sidebar count ticks up). Nothing else to register.
7. Commit.

## Rules

- Never write outside `clients/<client>/`.
- Code shared with sibling variants goes in `experiments/<e>/shared/`, not
  copied again.
