import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from "vite";
import { sourcePlugin } from "./source-plugin";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * Local dev reaches the deployed feedback service through a dev-server
 * proxy: /api/* forwards to the internal surface with the Access service
 * token from the repo-root .env attached server-side, so the secrets never
 * reach the browser and the threads tool works on localhost. No .env →
 * no proxy → /api 404s and the tool hides itself, same as before.
 */
function feedbackProxy(mode: string): Record<string, ProxyOptions> | undefined {
  const env = loadEnv(mode, repoRoot, "");
  if (!env.CF_ACCESS_CLIENT_ID || !env.CF_ACCESS_CLIENT_SECRET) return undefined;
  return {
    "/api": {
      target: (env.DP_FEEDBACK_URL ?? "https://design-playground.pages.dev/api").replace(
        /\/api\/?$/,
        "",
      ),
      changeOrigin: true,
      headers: {
        "CF-Access-Client-Id": env.CF_ACCESS_CLIENT_ID,
        "CF-Access-Client-Secret": env.CF_ACCESS_CLIENT_SECRET,
      },
    },
  };
}

const scopedClient = process.env.VITE_CLIENT;
if (scopedClient && !/^[a-z][a-z0-9-]*$/.test(scopedClient)) {
  throw new Error(`VITE_CLIENT must be a kebab-case client id, got "${scopedClient}"`);
}

/**
 * Physical exclusion for client preview builds (PRD-06): rewrites the
 * registry's glob literals from clients/STAR/ to clients/<id>/ before the
 * import-glob plugin sees them, so no module from any other client is ever
 * imported — their code, data, and even path strings stay out of the
 * bundle. Verified by scripts/verify-scoped-build.mjs in CI.
 */
function scopeRegistryGlobs(clientId: string): Plugin {
  return {
    name: "scope-registry-globs",
    enforce: "pre",
    transform(code, file) {
      if (!file.endsWith("/src/registry/discover.ts")) return null;
      return { code: code.replaceAll("/clients/*/", `/clients/${clientId}/`), map: null };
    },
  };
}

/**
 * The registry globs in app/src/registry/discover.ts reach outside the Vite
 * root into clients/ and themes/. The dev watcher only emits add/unlink
 * events for paths it watches, so without this a long-running dev server
 * never re-evaluates the globs when a file is created — new pages 404 until
 * a manual restart.
 */
function watchRegistrySources(): Plugin {
  return {
    name: "watch-registry-sources",
    configureServer(server) {
      server.watcher.add([
        fileURLToPath(new URL("../clients", import.meta.url)),
        fileURLToPath(new URL("../themes", import.meta.url)),
      ]);
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    ...(scopedClient ? [scopeRegistryGlobs(scopedClient)] : [sourcePlugin()]),
    watchRegistrySources(),
    react(),
    tailwindcss(),
  ],
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
  server: {
    port: 3003,
    fs: {
      allow: [repoRoot],
    },
    proxy: feedbackProxy(mode),
  },
}));
