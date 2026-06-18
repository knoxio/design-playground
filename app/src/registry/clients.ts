import { discoverClients } from "./discover";
import { discoverGlobalThemes } from "./themes";
import type { ClientEntry, ThemeEntry } from "./types";

const globalDiscovery = discoverGlobalThemes();

/** Repo-root themes/ — available to every client, listed last in the dock. */
export const globalThemes: ThemeEntry[] = globalDiscovery.themes;
export const globalThemeErrors: string[] = globalDiscovery.errors;

/**
 * VITE_CLIENT scopes a build to a single client (used by client-facing
 * preview deploys). Unset = internal app with every client. Physical
 * exclusion happens at build time: the hx-scope-registry-globs plugin in
 * vite.config narrows discover.ts's globs to the one client, so nothing
 * else is ever imported. This runtime filter is defense-in-depth.
 */
const only = import.meta.env.VITE_CLIENT as string | undefined;

const all = discoverClients(new Set(globalThemes.map((t) => t.id)));

export const clients: ClientEntry[] = only ? all.filter((c) => c.id === only) : all;

export function getClient(id: string | undefined): ClientEntry | undefined {
  return clients.find((c) => c.id === id);
}
