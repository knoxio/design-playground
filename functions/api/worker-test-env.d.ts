import "@cloudflare/vitest-pool-workers/types";

declare global {
  namespace Cloudflare {
    interface Env {
      DP_DB: D1Database;
      DP_CLIENT?: string;
      DP_TEAM_DOMAIN?: string;
    }
  }
}
