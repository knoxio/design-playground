import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Node-local tests for the deterministic build/skill scripts (dtcg-to-theme and,
 * over time, the mechanical-skill scripts). Plain Node — no DOM, no app aliases.
 */
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  test: {
    environment: "node",
    include: ["**/*.test.mjs"],
  },
});
