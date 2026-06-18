# Default-deny access: every surface sits behind Cloudflare Access. Design
# emails pass everywhere; client stakeholders pass only on their own preview
# and only when listed in client.yaml's preview.emails. `public: true` is
# the sole opt-out (no Access app is created for that preview).

resource "cloudflare_zero_trust_access_policy" "design" {
  account_id = var.account_id
  name       = "team-emails"
  decision   = "allow"

  include = [{
    email_domain = { domain = var.team_email_domain }
  }]
}

resource "cloudflare_zero_trust_access_application" "internal_app" {
  account_id          = var.account_id
  name                = "design-playground (internal)"
  domain              = "${cloudflare_pages_project.internal.name}.pages.dev"
  type                = "self_hosted"
  session_duration    = "24h"
  custom_deny_message = var.access_contact

  policies = [
    {
      id         = cloudflare_zero_trust_access_policy.design.id
      precedence = 1
    },
    {
      id         = cloudflare_zero_trust_access_policy.service_token.id
      precedence = 2
    },
  ]
}

resource "cloudflare_zero_trust_access_policy" "preview" {
  for_each = local.gated_previews

  account_id = var.account_id
  name       = "preview-${each.key}-stakeholders"
  decision   = "allow"

  include = concat(
    [{ email_domain = { domain = var.team_email_domain } }],
    [for d in each.value.domains : { email_domain = { domain = d } }],
    [for e in each.value.emails : { email = { email = e } }],
  )
}

resource "cloudflare_zero_trust_access_application" "preview_app" {
  for_each = local.gated_previews

  account_id          = var.account_id
  name                = "design-preview-${each.key}"
  domain              = "${cloudflare_pages_project.preview[each.key].name}.pages.dev"
  type                = "self_hosted"
  session_duration    = "24h"
  custom_deny_message = var.access_contact

  policies = [{
    id         = cloudflare_zero_trust_access_policy.preview[each.key].id
    precedence = 1
  }]
}
