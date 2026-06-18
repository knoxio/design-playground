import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end smoke (testing layer 1, tier D). Two dev servers: the internal
 * app on 3003 and a VITE_CLIENT-scoped client preview on 3010. Relies on
 * Playwright auto-waiting — no explicit timeouts (see CLAUDE.md rule 11).
 * Not part of `pnpm run ci`; run with `pnpm test:e2e`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { baseURL: "http://localhost:3003", trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm dev",
      url: "http://localhost:3003",
      reuseExistingServer: !process.env.CI,
      stdout: "ignore",
    },
    {
      command: "pnpm --filter @design/app exec vite --port 3010 --strictPort",
      env: { VITE_CLIENT: "marlow" },
      url: "http://localhost:3010",
      reuseExistingServer: !process.env.CI,
      stdout: "ignore",
    },
  ],
});
