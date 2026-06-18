# 0016 — The Cloudflare stack

**Status:** Accepted

## Context

The playground needs hosting for the internal app and one preview per client,
authentication in front of every surface, and a small shared store for
feedback threads. The operator is a small agency, so the running cost should
be near zero at agency scale, and the infrastructure should be defined in the
repo so a client folder merged to main produces its preview without a console
visit.

## Decision

Cloudflare end to end, all defined by Terraform from the repo and within the
free tier at agency scale:

- **Pages** — one project for the internal app, one `hx-preview-<id>` project
  per client. CI builds (scoped by `VITE_CLIENT`, ADR-0007) and deploys with
  wrangler; Terraform owns the projects, the shared D1 binding, and each
  preview's `HX_CLIENT` scope.
- **Access** — default-deny auth in front of every surface (ADR-0008).
- **Worker + D1** — the feedback API ships as Pages Functions inside every
  surface, all sharing one `hx-feedback` D1 database. Same-origin `/api/*`,
  so each surface's own Access app is the auth — no CORS, no separate auth
  service.

Terraform state lives in R2 (S3-compatible). `infra/clients.tf` reads every
`clients/<id>/client.yaml` as the source of truth, so a merged client folder
yields a Pages project and its Access app on the next apply. Deploy runs the
full gate, then applies infra only when `infra/**` or a `client.yaml`
changed, then deploys each surface in a matrix.

## Consequences

- Adding or granting a preview is a repo edit plus merge; no console.
- One D1 database serves every surface, scoped server-side by `HX_CLIENT`
  (ADR-0008) — cheap and simple at this scale.
- The stack is the deployment substrate for confidentiality (ADR-0008) and
  scoped previews (ADR-0007); those decisions assume it.
- Free-tier reliance is deliberate at agency scale; growth past it would
  revisit the storage and hosting choices, not the repo-as-source-of-truth
  model.
