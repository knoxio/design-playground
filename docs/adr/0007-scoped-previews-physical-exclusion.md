# 0007 — Scoped previews by physical exclusion

**Status:** Accepted

## Context

Each client reviews their prototype through a preview link. Clients share one
repository and one app (ADR-0001), so a preview must show only its own
client's work. A route guard on the full internal app is one
misconfiguration away from exposing client A to client B — the failure is a
data leak, and it is silent.

## Decision

Per-client previews exclude every other client at **build time**, not via
route guards. `VITE_CLIENT=<id>` narrows the registry's discovery globs so
the produced bundle physically contains only that client's folder. There is
no other client's code, route, or name in the deploy to guard.

`scripts/verify-scoped-build.mjs` (run as `pnpm verify:scoped`, part of
`pnpm run ci`) builds each client's preview and scans `dist/` for any other
client's path fragment, route prefix, or display name — and for inspect-mode
source stamps (`data-hx-source`). Any leak fails the build.

## Consequences

- A client preview cannot accidentally serve another client's surface,
  because the bytes are not present — isolation is a property of the
  artifact, not of runtime routing.
- Compile-time source stamps (used by the inspect overlay on internal
  builds) are stripped from client previews, verified by the same check.
- This enforces boundary rule 2 (ADR-0003) at the bundle level, in addition
  to the import-graph check.
- Server-side access control (ADR-0008) sits on top: each preview is its own
  Cloudflare Pages project behind its own Access app, so scoping is enforced
  both in the build and at the edge.

## Alternatives

**One app, route guard per client.** Rejected: a single misconfigured guard
or a leaked route exposes other clients; the safe artifact is one that does
not contain them at all.
