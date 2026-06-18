variable "account_id" {
  description = "Cloudflare account that hosts the playground (TF_VAR_account_id; CI supplies it from the CLOUDFLARE_ACCOUNT_ID secret)"
  type        = string
}

variable "team_email_domain" {
  description = "Email domain whose members can access every surface"
  type        = string
  default     = "example.com"
}

variable "access_contact" {
  description = "Shown on the Access denied page so stakeholders know whom to ask"
  type        = string
  default     = "Access is invite-only. Ask your team contact to add your email."
}
