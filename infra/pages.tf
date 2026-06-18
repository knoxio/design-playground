# Direct-upload Pages projects: CI builds and deploys with wrangler
# (.github/workflows/deploy.yml); Terraform owns the projects' existence,
# the shared feedback D1 binding, and each preview's client scope.

resource "cloudflare_pages_project" "internal" {
  account_id        = var.account_id
  name              = "design-playground"
  production_branch = "main"

  deployment_configs = {
    production = {
      compatibility_date = "2026-06-01"
      d1_databases = {
        DP_DB = { id = cloudflare_d1_database.feedback.id }
      }
      env_vars = {
        DP_TEAM_DOMAIN = { type = "plain_text", value = var.team_email_domain }
      }
    }
    preview = {
      compatibility_date = "2026-06-01"
      d1_databases = {
        DP_DB = { id = cloudflare_d1_database.feedback.id }
      }
      env_vars = {
        DP_TEAM_DOMAIN = { type = "plain_text", value = var.team_email_domain }
      }
    }
  }
}

resource "cloudflare_pages_project" "preview" {
  for_each = local.preview_projects

  account_id        = var.account_id
  name              = each.value.name
  production_branch = "main"

  deployment_configs = {
    production = {
      compatibility_date = "2026-06-01"
      d1_databases = {
        DP_DB = { id = cloudflare_d1_database.feedback.id }
      }
      env_vars = {
        DP_CLIENT       = { type = "plain_text", value = each.key }
        DP_TEAM_DOMAIN = { type = "plain_text", value = var.team_email_domain }
      }
    }
    preview = {
      compatibility_date = "2026-06-01"
      d1_databases = {
        DP_DB = { id = cloudflare_d1_database.feedback.id }
      }
      env_vars = {
        DP_CLIENT       = { type = "plain_text", value = each.key }
        DP_TEAM_DOMAIN = { type = "plain_text", value = var.team_email_domain }
      }
    }
  }
}
