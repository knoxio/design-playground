# Operations runbook

How the playground is deployed, gated, and accessed. The stack is Cloudflare
managed by Terraform; merge to main deploys everything. Governed by
[PRD-08](../prds/prd-08-deployment-access.md) and
[ADR 0016 — the Cloudflare stack](../adr/0016-cloudflare-stack.md).

## Surfaces

Two audiences, cleanly separated. Both run the same `app/dist` build; the
preview is scoped at build time by `VITE_CLIENT` ([ADR 0007](../adr/0007-scoped-previews-physical-exclusion.md)).

| Surface        | Pages project     | Build              | Sees                                         |
| -------------- | ----------------- | ------------------ | -------------------------------------------- |
| Internal app   | `hx-playground`   | full (all clients) | inspect, themes, variants, comment, resolve  |
| Client preview | `hx-preview-<id>` | `VITE_CLIENT=<id>` | one client: view + comment, prototype banner |

One preview project exists per client folder. The internal app is the team's
full playground; a preview ships exactly one client and physically excludes
all others (verified by `pnpm verify:scoped` in the CI gate).

Both surfaces serve the SPA and the feedback API (`/api/*`) from the same
origin — the API is Pages Functions inside each project
(`functions/api/[[path]].ts`), so there is no CORS and no separate auth.

## Access auth model

Every surface sits behind Cloudflare Access, **default-deny**
([ADR 0008](../adr/0008-access-based-confidentiality.md)). Defined in
`infra/access.tf`:

- **`@helixcollective.com` passes everywhere.** The `helix-emails` policy
  (domain `var.helix_email_domain`) is on the internal app and on every gated
  preview.
- **Client stakeholders pass only their own preview**, and only when listed in
  that client's `client.yaml`:

  ```yaml
  preview:
    emails: # individual stakeholders
      - sarah@marlowfreight.example
    domains: # whole company domains
      - marlowfreight.example
    # public: true   # explicit opt-out — no Access app at all
  ```

- **`public: true` is the only opt-out.** It removes the preview from
  `local.gated_previews`, so no Access application is created and the preview
  is open. Being unlisted is never the mechanism — an unlisted preview still
  deploys, but only helix emails pass.
- **Service tokens** (`automation-service-tokens`, `non_identity`) reach the
  internal surface's API for Mary's Claude session and headless automation.
- The Access denied page shows `var.access_contact` ("ask your Helix
  contact"), not a bare 403.

Sessions last 24h. The internal app's policy precedence is helix-emails (1),
service-token (2).

### Identity in the API

`functions/api/[[path]].ts` reads the validated identity from Access headers:
`cf-access-authenticated-user-email` (a real user) or `cf-access-jwt-assertion`
(a service token, no email). Neither present → `403` ("no identity — is this
surface behind Access?"). There are no anonymous reads or writes, so a
**public** preview (no Access, no JWT) gets a 403 on `/api/*` by design.

Helix-domain users and service tokens can moderate (set thread status); client
stakeholders can create threads and reply but not resolve.

## Feedback service (Worker + D1)

The comment-thread store ([PRD-05](../prds/prd-05-overlay-feedback.md) slice 2,
[ADR 0017](../adr/0017-feedback-engine-is-claude-session.md)). One D1 database,
`hx-feedback` (`infra/feedback.tf`), bound as `HX_DB` into every Pages project
(`infra/pages.tf`). The API is same-origin `/api/*` on each surface, so each
surface's own Access app gates its threads.

Routes (all under `/api/`):

| Method | Path                     | Who             | Effect                        |
| ------ | ------------------------ | --------------- | ----------------------------- |
| GET    | `/health`                | anyone          | liveness                      |
| GET    | `/me`                    | authenticated   | the caller's email            |
| GET    | `/threads`               | authenticated   | threads + messages for client |
| POST   | `/threads`               | authenticated   | create a thread               |
| POST   | `/threads/<id>/messages` | authenticated   | reply                         |
| PATCH  | `/threads/<id>`          | helix / service | set status                    |

Previews are hard-scoped by the `HX_CLIENT` env var; the internal app passes
`?client=<id>`. The schema is created lazily on first request (`ensureSchema`).

Statuses: `open` → `applied` / `rejected` / `outdated` (or reopen to `open`).

### Local access

`scripts/feedback-mcp.mjs` (the `hx-feedback` MCP server, `.mcp.json`) and the
dev-server `/api/*` proxy both authenticate to the deployed service with the
Access service token from a gitignored `.env` (`CF_ACCESS_CLIENT_ID`,
`CF_ACCESS_CLIENT_SECRET`, `HX_FEEDBACK_URL` — see `.env.example`). This lets
the threads tooling work on localhost with secrets kept server-side.

## Infrastructure (Terraform)

All Cloudflare resources are declared in `infra/*.tf`; `clients/*/client.yaml`
is the source of truth.

| File           | Owns                                                            |
| -------------- | --------------------------------------------------------------- |
| `main.tf`      | provider, required versions, R2 backend                         |
| `variables.tf` | `account_id`, `helix_email_domain`, `access_contact`            |
| `clients.tf`   | `local.clients` / `preview_projects` (from the clients dir)     |
| `pages.tf`     | internal + per-client Pages projects, the `HX_DB` binding       |
| `access.tf`    | the helix policy, internal app, per-preview apps and policies   |
| `feedback.tf`  | the D1 database, the service-token policy                       |
| `imports.tf`   | one-time adoption of the bootstrapped projects (safe to delete) |

The per-client resources are a `for_each` over `fileset(clients, "*/client.yaml")`.

- **State lives in R2** (S3-compatible backend, bucket `hx-playground`). The
  endpoint is account-specific and supplied at init:
  ```
  terraform -chdir=infra init -backend-config="endpoints={s3=\"<endpoint>\"}"
  ```
  with `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` set to the R2 token pair.
- **Wrappers:** `pnpm infra:plan`, `pnpm infra:apply`. A human can run them
  without Claude.
- **Provider token** needs Cloudflare Pages: Edit and Access: Apps and
  Policies: Edit.

## Deploy pipeline

Merge to main is the only deploy path — no staging, no promotion
([PRD-08](../prds/prd-08-deployment-access.md) non-goals).
`.github/workflows/deploy.yml` runs four jobs:

1. **checks** — `pnpm install --frozen-lockfile && pnpm run ci`. The same gate
   as the PR `CI` workflow; a main push is never gated twice.
2. **preflight** — sets `ready=true` only if `CLOUDFLARE_API_TOKEN` is present
   (no token → deploys skipped with a notice); emits the deploy matrix
   (`internal` + every folder in `clients/`).
3. **infra** — runs only when the push diff touches `infra/**` or any
   `client.yaml`; `terraform init` (R2 backend) then `apply -auto-approve`.
4. **deploy** — matrix over the targets: builds (`pnpm build`, or
   `VITE_CLIENT=<id> pnpm build` for previews) and `wrangler pages deploy
app/dist` to `hx-playground` or `hx-preview-<id>`. Runs when checks passed
   and infra succeeded or was skipped.

`concurrency: deploy-main` (no cancel) serializes main deploys.

### Secrets

In GitHub Actions secrets, never in the repo:
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `R2_ENDPOINT`,
`R2_STATE_ACCESS_KEY_ID`, `R2_STATE_SECRET_ACCESS_KEY`.

The Access **service token** (`CF_ACCESS_CLIENT_ID` /
`CF_ACCESS_CLIENT_SECRET`) for local overlay use lives in the gitignored `.env`
— stored in **Bitwarden**, never committed, never in this doc. Copy
`.env.example` to `.env` and fill from Bitwarden.

## Runbook

### Add a new client's preview

Automatic. Create the folder with `/new-client` (it writes `client.yaml`) and
merge to main. The next deploy:

- `preflight` adds `<id>` to the matrix → builds and deploys
  `hx-preview-<id>`;
- `infra` (triggered by the new `client.yaml`) creates the Pages project and,
  unless `public: true`, the Access app and policy.

No dashboards, no manual project creation.

### Grant a stakeholder access

Add their email (or company domain) to the client's `client.yaml` `preview`
block and merge:

```yaml
preview:
  emails:
    - newperson@client.example
```

The next `infra` apply updates that preview's Access policy. To open a preview
entirely, set `public: true` (removes the Access app — the `/api/*` feedback
routes then 403, since there is no identity).

## On-demand tools

Neither blocks CI; both need the dev server on `:3003` and local Chrome for
their browser steps.

- **`pnpm handoff <client>`** — the mechanical exit artifacts (tokens.json,
  components.md, real-vs-mocked skeleton, chrome-less screens). Driven by the
  [`handoff` skill](./skills.md#handoff); see [PRD-07](../prds/prd-07-handoff.md).
- **`pnpm a11y <client>`** — an axe-core WCAG 2.2 AA audit of every main page
  through the `/frame/...` route under the client's default theme. Scores,
  never gates — exits 0 regardless.
