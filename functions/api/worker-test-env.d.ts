import "@cloudflare/vitest-pool-workers/types";

declare global {
  namespace Cloudflare {
    interface Env {
      HX_DB: D1Database;
      HX_CLIENT?: string;
      HX_HELIX_DOMAIN?: string;
    }
  }
}
