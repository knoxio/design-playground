# PRD-08 — Deployment & access

**Status:** Built
**Owns:** C15 (deployment & access — Cloudflare Pages/Access/Terraform/D1)
**Depends on:** PRD-06 (physical exclusion makes per-client deploys safe to host); serves PRD-05 (hosts the feedback service and comment-enabled previews)
**Governing ADRs:** [0016-cloudflare-stack](../adr/0016-cloudflare-stack.md), [0008-access-based-confidentiality](../adr/0008-access-based-confidentiality.md), [0007-scoped-previews-physical-exclusion](../adr/0007-scoped-previews-physical-exclusion.md), [0015-e2e-outside-pre-push-gate](../adr/0015-e2e-outside-pre-push-gate.md)

## Problem

Mary's loop has to reach beyond localhost: clients view and comment on a hosted
preview, access control is enforced rather than documented, and merge to main
updates everything with the two audiences cleanly separated.

## Design

### The two audiences

| Surface                             | Build                              | Access                                                      | Can                                                     |
| ----------------------------------- | ---------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| **Internal app**                    | full (all clients)                 | any `@helixcollective.com` email (Cloudflare Access)        | everything: inspect, themes, variants, comment, resolve |
| **Client preview** (one per client) | `VITE_CLIENT=<id>` scoped (PRD-06) | per-client email list from `client.yaml` + all helix emails | view + comment threads                                  |

### Access from the repo

`client.yaml`'s optional `preview` block is the access list:

```yaml
preview:
  emails:
    - sarah@marlowfreight.example
  domains:
    - marlowfreight.example
  # public: true   # explicit opt-out of access control; absent = default-deny
```

- **Default-deny (ADR [0008](../adr/0008-access-based-confidentiality.md)):** no
  `preview` block → the preview deploys but only helix emails pass Access.
  Public requires the explicit `public: true` — being unlisted is never the
  mechanism. A public preview disables commenting (no Access identity; PRD-05).
- Granting a stakeholder access = add an email (or their whole domain), merge.
  No dashboards, no tickets.

### Infrastructure as code — Terraform

The Cloudflare provider (`infra/`) manages one Pages project per client plus one
for the internal app, one Access application/policy per surface (generated
`for_each` over `clients/*/client.yaml`), the feedback Worker, and the D1
database. State lives in R2. `pnpm infra:plan` / `pnpm infra:apply` wrap the
mechanics so a human can run them without Claude. A new client folder merged
becomes a gated preview on the next apply with no infra edits — Terraform fits
because Access, Pages, Workers, and D1 live under one provider.

### CI deploys

Merge to main builds the internal app plus every client's scoped build (a matrix
over `clients/*/`) and `wrangler pages deploy`s each. The Terraform apply job
runs only when `infra/**` or any `client.yaml` changed; the deploy job runs on
every main merge. Both reuse the `pnpm run ci` gate — nothing deploys that did
not pass it. Preview links update within minutes of `/apply-feedback`'s merge,
the loop's closing beat.

### Hygiene

- Preview deploys carry the PROTOTYPE banner and commenting (PRD-05/06); the
  internal deploy carries full chrome.
- Cloudflare API tokens live in GitHub Actions secrets, never in the repo; the
  Worker dev token lives in a gitignored `.env` for local overlay use.
- The Access-denied page names whom to contact (Mary), not a bare 403.

## Behavior / acceptance

1. Merge a new client with `preview.emails` → its preview URL is live; listed
   emails and helix emails pass Access, others get the friendly denial.
2. Merge to main → the internal app and all previews redeploy without manual
   steps.
3. A comment posted on a preview reaches `/apply-feedback` locally; the applied
   change is visible on that preview after merge.
4. `pnpm infra:plan` on a clean tree shows no drift.

## Non-goals

- Custom domains per client (`pages.dev` subdomains suffice until a client cares;
  a one-line Terraform change later).
- Staging environments — main is the only truth; prototypes need no promotion
  pipeline.
