# The clients directory is the source of truth: every clients/<id>/client.yaml
# yields a Pages project and (unless `preview.public: true`) an Access app
# whose allowed emails come from the yaml's `preview.emails` list. A new
# client folder merged to main appears here on the next plan/apply.

locals {
  client_files = fileset("${path.module}/../clients", "*/client.yaml")

  clients = {
    for f in local.client_files :
    dirname(f) => yamldecode(file("${path.module}/../clients/${f}"))
  }

  preview_projects = {
    for id, c in local.clients : id => {
      name    = "design-preview-${id}"
      emails  = try(c.preview.emails, [])
      domains = try(c.preview.domains, [])
      public  = try(c.preview.public, false)
    }
  }

  gated_previews = { for id, p in local.preview_projects : id => p if !p.public }
}
