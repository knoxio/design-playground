# Deploying your own Cloudflare stack

How to provision the playground's hosting from a fresh Cloudflare account: the
internal app, one preview per client, the feedback database, and the Access
gate in front of all of them. This is the from-zero companion to the
[operations runbook](../reference/operations.md), which describes how the
deployed system behaves; here we create it.

**You only need this if you deploy.** Local prototyping (`pnpm dev`) and the
full CI gate need none of it. The live comment overlay needs one token — the
Access service token in [step 4](#4-access-service-token-local-feedback-overlay),
also covered in [getting-started](getting-started.md#one-time-machine-setup-the-feedback-service).

Everything is declared in `infra/*.tf` (Cloudflare via Terraform) and deployed
by `.github/workflows/deploy.yml` on every push to `main`. The stack uses
Cloudflare Pages, D1, R2, and Zero Trust Access — all have free tiers large
enough to start.

## Three credentials, don't mix them up

| Credential                      | Created in                           | Lives in                           | Used for                                   |
| ------------------------------- | ------------------------------------ | ---------------------------------- | ------------------------------------------ |
| **API token**                   | My Profile → API Tokens              | GitHub Actions secret + local env  | Terraform + `wrangler` deploys             |
| **R2 S3 token** (key id/secret) | R2 → Manage R2 API Tokens            | GitHub Actions secrets + local env | Terraform state backend (R2)               |
| **Access service token**        | Zero Trust → Access → Service Tokens | local `.env` only                  | local feedback overlay / `/apply-feedback` |

## 1. Account ID

Cloudflare dashboard → **Workers & Pages** (or any domain) → the **Account ID**
in the right sidebar; or run `pnpm exec wrangler whoami`. This is
`CLOUDFLARE_ACCOUNT_ID` (GitHub secret) and `TF_VAR_account_id` (Terraform).

## 2. API token (deploy + Terraform)

**My Profile → API Tokens → Create Token → Create Custom Token.** Add three
**Account**-scoped permissions:

- Account · **Cloudflare Pages** · Edit
- Account · **Access: Apps and Policies** · Edit
- Account · **D1** · Edit

Under **Account Resources**, include your account. No Zone resources are
needed. This is `CLOUDFLARE_API_TOKEN`.

> The D1 permission is easy to miss — `infra/feedback.tf` creates the feedback
> database, so a token without D1: Edit fails on the first `terraform apply`.

## 3. R2 bucket + token (Terraform state)

Terraform state lives in an R2 bucket via the S3-compatible backend
(`infra/main.tf`).

1. **R2 → Create bucket** → name it `design-playground`. This must match
   `backend "s3" { bucket = ... }` in `infra/main.tf` — rename both together if
   you prefer a different name.
2. **R2 → Manage R2 API Tokens → Create API token** → **Object Read & Write**,
   scoped to that bucket. You get an **Access Key ID** and a **Secret Access
   Key** → `R2_STATE_ACCESS_KEY_ID` / `R2_STATE_SECRET_ACCESS_KEY`.
3. Your S3 endpoint is `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` →
   `R2_ENDPOINT`.

## 4. Access service token (local feedback overlay)

Only needed for the local comment overlay and `/apply-feedback`; the deploy
itself does not use it. The first time you open **Zero Trust** you pick a team
domain (a one-time setup).

**Zero Trust → Access → Service Tokens → Create Service Token.** Copy the
**Client ID** and **Client Secret** into your local `.env`
(`CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`) — see
[getting-started](getting-started.md#one-time-machine-setup-the-feedback-service).
The `automation-service-tokens` policy (`infra/feedback.tf`) admits any valid
service token to the internal app's `/api/*`.

## 5. GitHub Actions secrets

`deploy.yml` reads five secrets. From a checkout of your fork:

```sh
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set R2_ENDPOINT
gh secret set R2_STATE_ACCESS_KEY_ID
gh secret set R2_STATE_SECRET_ACCESS_KEY
```

Each prompts for the value; nothing is echoed or committed. Until
`CLOUDFLARE_API_TOKEN` is set, `deploy.yml`'s preflight skips every deploy with
a notice, so Actions stays green before you provision.

## 6. Point Access at your own domain

`infra/variables.tf` ships defaults from the original deployment:

- `team_email_domain` defaults to `example.com` — the domain whose
  members pass Access on **every** surface.
- `access_contact` defaults to a "ask your Design contact" denied-page message.

**Override both, or every surface grants access to the wrong domain.** The CI
infra job does not pass `TF_VAR_team_email_domain`, so the simplest path is to
edit the defaults in `infra/variables.tf` (applies to both local and CI). To
keep the defaults untouched, instead export `TF_VAR_team_email_domain` /
`TF_VAR_access_contact` locally and add them to the infra job's `env` in
`deploy.yml`.

## 7. First apply (the bootstrap)

`infra/imports.tf` adopts Pages projects that the original deployment created
with `wrangler` _before_ its first apply. On a fresh account those projects do
not exist, so the import would fail.

**Delete `infra/imports.tf`.** Without it, `terraform apply` creates the
projects itself. (The file already documents itself as safe to delete after the
first apply; on a new account you delete it before.)

Then, from a checkout with the credentials above exported:

```sh
export TF_VAR_account_id="<account id>"
export CLOUDFLARE_API_TOKEN="<api token>"
export AWS_ACCESS_KEY_ID="<R2 access key id>"
export AWS_SECRET_ACCESS_KEY="<R2 secret access key>"

terraform -chdir=infra init \
  -backend-config="endpoints={s3=\"https://<ACCOUNT_ID>.r2.cloudflarestorage.com\"}"

pnpm infra:plan    # review
pnpm infra:apply
```

This creates the `design-playground` internal Pages project, one `design-preview-<id>`
per folder in `clients/`, the `design-feedback` D1 database (bound as `DP_DB`), and
the Access apps and policies.

## 8. Deploy

Push to `main` (or merge a PR). `deploy.yml` runs the CI gate, then preflight,
then the infra apply (only when the push touches `infra/**` or any
`client.yaml`), then builds and `wrangler pages deploy` for the internal app
and every preview. After this first run, adding a client is automatic — see the
[runbook](../reference/operations.md#runbook).

## Naming

`design-playground` (internal Pages project + R2 state bucket), `design-preview-<id>`
(previews), and `design-feedback` (D1) are the resource names baked into `infra/`.
They are just identifiers; rename them in the `.tf` files if you prefer, keeping
the R2 bucket name in `infra/main.tf` and the `gh secret`/endpoint values in
sync.
