---
name: promote-component
description: Promote a client component into the shared kit (@design/ui). Core-owner operation — its own reviewed PR, never bundled with client work. Use when a promotion candidate is approved for the kit.
---

# Promote component

Move a client component into `packages/ui` — the deliberate, reviewed act
the `promoteCandidate` queue feeds. This touches protected paths: it is
**its own PR**, reviewed by the engineering owner, never mixed with client
work.

## Inputs

- **client** + **component** (required) — ideally one listed by
  `pnpm promotion-candidates`. If it isn't flagged, ask why it's being
  promoted before proceeding.
- **kit name** (required): the generalized name (`InvoiceStatusBadge` →
  `Badge`). Kit components are client-agnostic by definition.

## Steps

1. **Generalize.** Strip client-specific types and vocabulary: a
   `Record<InvoiceStatus, …>` style map becomes a generic prop API (e.g.
   `tone: "neutral" | "positive" | "attention" | "negative"`). Style only
   through token utilities. No client imports — kit never imports from
   `clients/` (boundary rule, CI-enforced).
2. Create `packages/ui/src/components/<KitName>.tsx`; export it (and its
   prop types) from `packages/ui/src/index.ts`.
3. **Add the `kitManifest` entry** in `packages/ui/src/gallery.tsx` — id,
   description, representative demo. A kit component without a manifest
   entry is invisible in the galleries; the change is incomplete without it.
4. Rewrite the originating client's component as a thin wrapper over the kit
   component (keeping its client vocabulary, e.g. mapping `InvoiceStatus` →
   `tone`), or replace its usages outright if no mapping is needed. Remove
   its `promoteCandidate` flag either way; `pnpm promotion-candidates` must
   no longer list it.
5. Check other clients for near-duplicates of the same pattern (that overlap
   is usually why promotion was approved) — note them in the PR description;
   migrating them is each client's own follow-up, not part of this PR.
6. Run the full suite: `pnpm lint && pnpm format:dir packages/ui clients/<client> && pnpm typecheck &&
pnpm boundaries && pnpm build`. Verify in the app: the component renders
   in `/kit` and per-client kit galleries under different themes.

## Rules

- Never bundle with client feature work — kit changes ride alone.
- The kit component must look right under any theme (check at least the
  promoting client's theme + design + design-dark on the gallery).
- If generalizing reveals the component is actually client-specific after
  all, stop and say so — demotion back to the queue is a fine outcome.
