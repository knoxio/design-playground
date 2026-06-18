terraform {
  required_version = ">= 1.9"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }

  # State lives in R2 (S3-compatible). The endpoint is account-specific and
  # supplied at init time (CI writes it from the R2_ENDPOINT secret):
  #   terraform -chdir=infra init -backend-config="endpoints={s3=\"<endpoint>\"}"
  # with AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY set to the R2 token pair.
  backend "s3" {
    bucket                      = "design-playground"
    key                         = "design-playground.tfstate"
    region                      = "auto"
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
    use_path_style              = true
  }
}

provider "cloudflare" {
  # Reads CLOUDFLARE_API_TOKEN from the environment. Required token
  # permissions: Cloudflare Pages: Edit, Access: Apps and Policies: Edit.
}
