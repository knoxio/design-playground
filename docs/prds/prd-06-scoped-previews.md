# PRD-06 — Scoped preview builds

**Status:** Built
**Owns:** C12 (scoped preview builds + PROTOTYPE banner)
**Depends on:** PRD-01 (auto-discovery is what makes build-time filtering clean). PRD-08 consumes it: physical exclusion is what makes per-client deploys safe to host.
**Governing ADRs:** [0007-scoped-previews-physical-exclusion](../adr/0007-scoped-previews-physical-exclusion.md), [0002-filesystem-is-the-registry](../adr/0002-filesystem-is-the-registry.md), [0008-access-based-confidentiality](../adr/0008-access-based-confidentiality.md)

## Problem

A runtime route guard is one misconfiguration away from exposing client A's work
to client B. If `VITE_CLIENT` only filtered the registry at runtime, every other
client's code, mock data, and naming would still sit in the served bundle, one
F12 away. The preview also needs a visible marker that what the stakeholder sees
is a prototype, not the finished product.

## Design

### Physical exclusion

`VITE_CLIENT=<id> pnpm build` produces a bundle whose assets contain no module
from any other client folder. Registry discovery resolves its glob against the
env var at build time, so other clients are never imported — not merely not
rendered (ADR [0007](../adr/0007-scoped-previews-physical-exclusion.md)). The
internal build (no `VITE_CLIENT`) is unchanged.

### Leak verification

`pnpm verify:scoped` (`scripts/verify-scoped-build.mjs`) is part of the CI gate:
it builds with a scope and greps `dist/` for any other client's id, name, route,
or `data-dp-source`, failing on a match. The check guards from the moment a
second client lands.

### PROTOTYPE banner

Scoped builds render a persistent, non-dismissible banner — "Prototype — sample
data, not the final product." It is app chrome: clients cannot remove or restyle
it. Internal builds show nothing.

### Stripped internals

Scoped builds exclude source stamping (PRD-05), the dock with its styleset
switcher (PRD-02), and the cross-client overview — the app boots directly into
the client's first page. Commenting stays (PRD-05), as the one client-facing
tool, minus status controls and export; it is hosted on the client-view toolbar
(PRD-09).

## Behavior / acceptance

1. `VITE_CLIENT=demo pnpm build` plus the grep proves no other client's path, id,
   or mock-data string appears in `dist/`.
2. A scoped build boots straight into the client's pages with the banner — no
   overview, no switcher, no source stamps.
3. The internal build is byte-for-byte unaffected when the env var is unset.

## Non-goals

- Hosting, access policies, CI deploys (PRD-08); the comment system (PRD-05).
- Analytics on previews; custom domains per client.
