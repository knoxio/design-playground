# The feedback thread store (PRD-05 slice 2). One D1 database shared by
# every surface; the API ships as Pages Functions inside each project, so
# each surface's own Access app gates its /api/* routes — no CORS, no
# separate auth. The service token policy lets Mary's Claude session (and
# any headless automation) reach the internal surface's API with
# CF-Access-Client-Id/Secret headers from a gitignored .env.

resource "cloudflare_d1_database" "feedback" {
  account_id = var.account_id
  name       = "design-feedback"

  # The API rejects a null read_replication on update; state it explicitly.
  read_replication = {
    mode = "disabled"
  }
}

resource "cloudflare_zero_trust_access_policy" "service_token" {
  account_id = var.account_id
  name       = "automation-service-tokens"
  decision   = "non_identity"

  include = [{
    any_valid_service_token = {}
  }]
}
