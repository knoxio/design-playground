# 0004 — Shared-kit mutation rule

**Status:** Accepted

## Context

The shared kit (`@helix/ui`) is a real internal product, token-driven and
client-agnostic, used by every client. The boundary rules (ADR-0003) check
import direction, but they do not catch the most likely regression: a client
needs `Button` to differ, Claude helpfully edits the shared `Button`, and
every client shifts at once. The edit respects every import boundary and is
still wrong.

## Decision

Client-specific needs are met by **wrapping or overriding inside the client
folder** (`clients/<id>/components/`), never by editing the kit. This rule
lives in the root `CLAUDE.md` so Claude enforces it during authoring.

Promotion of a component into the kit is a **separate, deliberate PR** that
the core owner reviews — never bundled with client work. A client component
flags itself as a candidate with `promoteCandidate = true` plus the _why_;
candidates are listed by `pnpm promotion-candidates` and badged in the
gallery. The flag is a queue, not an action.

Every kit component ships a `kitManifest` entry (id, description, demo) in
`packages/ui/src/gallery.tsx`; a component without one is invisible to the
galleries. Adding one without the other is an incomplete change.

## Consequences

- One client's needs never silently restyle another's.
- The kit only grows by review, so it stays a curated product rather than a
  junk drawer. Curation time must be budgeted, or client folders become
  where everything actually lives.
- Promotion moves code up the scope ladder deliberately (ADR-0005,
  ADR-0006): variant `shared/` → client `components/` → kit, each step its
  own decision.
