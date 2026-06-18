import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Registry/contract tests run in Node — the discovery layer is pure (string
 * and module inputs, no DOM). The react plugin is needed only because
 * `discover.ts` eagerly imports client page/component `.tsx` modules via
 * `import.meta.glob`; the aliases mirror `vite.config.ts` so `@design/ui` and
 * the `clients/` glob resolve identically to the app build.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      {
        find: "@design/ui/icons",
        replacement: fileURLToPath(new URL("../packages/ui/src/icons.ts", import.meta.url)),
      },
      {
        find: "@design/ui",
        replacement: fileURLToPath(new URL("../packages/ui/src/index.ts", import.meta.url)),
      },
      { find: "#clients", replacement: fileURLToPath(new URL("../clients", import.meta.url)) },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
