# 0008 — Access-based confidentiality

**Status:** Accepted

## Context

Every deployed surface — the internal app and each client preview — carries
confidential client work and must not be open to the web. The build already
scopes a preview to one client (ADR-0007); the network layer must enforce
who may open each surface, default to denying, and let Design grant a
stakeholder access by editing a file, not a console.

## Decision

Cloudflare Access in front of every surface, **default-deny**, managed by
Terraform from the repo (ADR-0016):

- The team email domain passes on **every** surface.
- A client preview additionally admits the emails and domains listed in that
  client's `client.yaml` `preview` block. No block means design-only;
  `public: true` is the sole opt-out (no Access app is created).
- Automation (Mary's Claude session, the dev-server proxy) authenticates with
  a Cloudflare Access **service token** from a gitignored `.env`.

The feedback Worker derives identity from Access headers: the validated email
on identity requests, a service-token JWT for automation, and a 403 for
anyone with no identity — there are no anonymous reads or writes. Status
changes are Design-or-service only. Previews are hard-scoped server-side by
the `DP_CLIENT` env var, so a preview's `/api/*` can only ever touch its own
client's threads.

## Consequences

- Granting a stakeholder access is "add an email to `client.yaml`, merge" —
  the Terraform plan picks it up. Revoking is removing it.
- Confidentiality holds at two layers: the preview build contains no other
  client (ADR-0007), and the edge admits only listed identities.
- Same-origin `/api/*` means each surface's own Access app is the auth for
  its feedback API — no CORS, no separate auth surface.
- Losing the service token leaks automation's reach into the internal API;
  it stays gitignored and out of any deployed bundle.
