---
name: decide-experiment
description: Graduate an experiment's chosen variant into the client's Main pages and record the decision. Use when a client or Mary picks a winning variant, decides an experiment, or asks to make a variant the real design.
---

# Decide experiment

Graduation per `docs/reference/client-folder-contract.md`: deciding is a **merge,
not a flag**. The chosen variant's pages become Main; the experiment closes.

## Inputs

- **client**, **experiment**, **winning variant** (all required).
- **rationale** (required): one line on why this variant won. If not given,
  ask — the decision log is only useful if it says why.

## Validate before touching anything (refuse otherwise)

- `experiment.yaml` exists and `status: active`.
- The winning variant folder exists under `variants/`.

## Drift check

For each variant page that overrides a Main page, check whether the Main
page changed after the variant was created:

```
git log --oneline <first-commit-of-variant>.. -- clients/<c>/pages/<page>.tsx
```

If Main moved since the fork, show Mary the diff between current Main and
the variant's version and confirm before overwriting — graduation must not
silently discard Main edits made during the experiment.

If the experiment has no commit history (uncommitted session), fall back to
diffing each overridden Main page against the variant's version directly and
confirm anything surprising with Mary.

## Steps

1. Copy the winning variant's `pages/*` into the client's `pages/`
   (replacing overridden files, adding new ones). If the variant relied on
   `experiments/<e>/shared/` code, move what Main now needs into the
   client's `components/` and fix imports — Main must never import from an
   experiment folder (boundary rules).
2. Fix relative imports in the copied pages (they move four directories up:
   `../../../../../data/...` becomes `../data/...`).
3. **Theme promotion:** if `experiment.yaml` declares a `theme` that lives
   in the experiment's (or winning variant's) scope, move that YAML into the
   client's `themes/` (`git mv` when tracked, plain `mv` when not). If a
   client theme with that filename already exists, stop and ask. Ask Mary
   whether the promoted theme should become `client.yaml`'s `defaultTheme`.
   Leave the `theme:` key in `experiment.yaml` — it records history, and
   resolution still finds the theme at client scope. Undeclared scoped
   themes stay where they are.
4. Update `experiment.yaml`:

   ```yaml
   status: decided
   chosen: <variant-id>
   decided: <today, YYYY-MM-DD — use the real date>
   rationale: <one line>
   ```

5. Append to the client `CLAUDE.md` Decision log:
   `- <date>: <experiment name> → <variant display name> — <rationale>`
6. Run `pnpm lint && pnpm format:dir clients/<client> && pnpm typecheck && pnpm boundaries &&
pnpm build`. Must pass.
7. If a dev server is available, confirm: the decided experiment is gone
   from the sidebar and dock; Main shows the graduated pages.
8. Commit the graduation as one commit.

## Rules

- Never delete losing variants — they stay in git, untouched.
- Never write outside `clients/<client>/`.
- One experiment per invocation; no batch decisions.
