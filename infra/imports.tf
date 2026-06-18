# The three initial Pages projects were bootstrapped with wrangler before
# the first terraform apply; these imports adopt them into state. Safe to
# delete once the first apply has run.

import {
  to = cloudflare_pages_project.internal
  id = "${var.account_id}/design-playground"
}

import {
  to = cloudflare_pages_project.preview["marlow"]
  id = "${var.account_id}/design-preview-marlow"
}

import {
  to = cloudflare_pages_project.preview["demo"]
  id = "${var.account_id}/design-preview-demo"
}
