# 0001 — One app, clients as folders

**Status:** Accepted

## Context

The playground hosts many client engagements at once: Helix runs N clients,
each with M experiments and variants. Every engagement needs the same core —
app shell, registry, theming, the kit, the feedback overlay — and benefits
from reusing themes, components, and patterns built for earlier clients.

The prototype is reference, not the shipping artifact: engineers rebuild the
real application from the PRD plus the prototype plus the token file, in their
own repo. So the playground never needs to ship a client's code; it needs to
let one designer build and compare prototypes cheaply and hand off a folder.

## Decision

One application, one repository, everything on `main`. A client is a folder
under `clients/<id>/`. The core lives in `app/`, the shared kit in
`packages/ui/`, the house themes in `themes/`. Adding a client is adding a
folder.

## Consequences

- Cross-client reuse is a file copy or a kit promotion away, not a cross-repo
  dependency. Themes and patterns spread without packaging ceremony.
- The core is built and maintained once. A fix to the shell or registry
  reaches every client on the next merge.
- Handoff extracts a client folder plus its token file — self-contained,
  because the real product lives in the engineers' repo anyway.
- Clients share a working tree, so isolation is enforced by boundary rules
  (ADR-0003) and by physical build-time exclusion for previews (ADR-0007),
  not by repository walls.

## Alternatives

**Repo per client.** Rejected: it kills cross-client reuse, creates template
drift as each repo's copy of the core diverges, and buys isolation the
engagement never needs — handoff only ever extracts a folder and a token
file, since the shipping app is rebuilt elsewhere.
