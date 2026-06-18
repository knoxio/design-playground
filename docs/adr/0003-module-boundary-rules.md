# 0003 — Module boundary rules

**Status:** Accepted

## Context

Clients share one repository (ADR-0001). A designer drives Claude, which is
helpful by default: asked to make a thing work for one client, it will reach
across folders — import another client's component, edit a shared kit
component, or wire a client page into app internals. Each of those quietly
couples things that must stay independent: one client to another, the kit to
a client, the core to client specifics.

## Decision

Four boundary rules, enforced in CI (dependency-cruiser plus path checks in
`pnpm boundaries`, and the scoped-build leak check):

1. **Clients-only PRs cannot touch `app/` or `packages/ui/`.** A change under
   `clients/**` merges on green; the boundary checks keep client work from
   reaching into the core.
2. **No client imports from another client.** To reuse something, copy it or
   propose promoting it to `@design/ui`.
3. **The shared kit imports nothing from `clients/` or `app/`.** It is
   client-agnostic by construction.
4. **Clients import only `@design/ui`** (plus their own folder). The registry
   in `app/src/registry/` is the single sanctioned door from app to client
   code.

## Consequences

- A client's blast radius is its own folder. Breaking one client cannot
  break another or the core.
- The kit stays reusable: it never depends on anything downstream of it.
- Merge-on-green for `clients/**` is safe because the rules wall off
  everything a client edit could otherwise reach (ADR-0014).
- These rules catch import direction but not in-place mutation of a shared
  module — that failure is governed separately (ADR-0004).
- The scoped-preview leak check (ADR-0007) enforces rule 2 at the bundle
  level: a client's build must physically exclude every other client.
