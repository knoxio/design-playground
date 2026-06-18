import { fileURLToPath } from "node:url";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));
const main = fileURLToPath(new URL("./api/[[path]].ts", import.meta.url));

export default defineConfig({
  root,
  plugins: [
    cloudflareTest({
      main,
      miniflare: {
        compatibilityDate: "2025-06-01",
        compatibilityFlags: ["nodejs_compat"],
        d1Databases: { HX_DB: "hx-feedback-test" },
      },
    }),
  ],
  test: {
    include: ["api/**/*.test.ts"],
  },
});
