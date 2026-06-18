import { themeSchema } from "./schemas";
import type { ThemeEntry, ThemeScope } from "./types";
import { parseYamlFile, relativeToClients } from "./yaml";

const globalThemeYamls = import.meta.glob<string>("../../../themes/*.yaml", {
  query: "?raw",
  import: "default",
  eager: true,
});

type CollectThemesArgs = {
  source: Record<string, string>;
  pattern: RegExp;
  scope: ThemeScope;
  makeKey: (id: string) => string;
  errors: string[];
  ownerLabel?: string;
};

/** Discover folder-scoped themes from a glob source, keyed by scope-qualified id. */
export function collectThemes({
  source,
  pattern,
  scope,
  makeKey,
  errors,
  ownerLabel,
}: CollectThemesArgs): ThemeEntry[] {
  const themes: ThemeEntry[] = [];
  for (const [globPath, raw] of Object.entries(source)) {
    const path = relativeToClients(globPath);
    const match = path.match(pattern);
    if (!match) continue;
    const id = match[match.length - 1];
    if (id === undefined) continue;
    const tokens = parseYamlFile(raw, themeSchema, `clients/${path}`, errors);
    if (tokens) themes.push({ key: makeKey(id), id, scope, ownerLabel, tokens });
  }
  return themes.toSorted((a, b) => a.id.localeCompare(b.id));
}

export type GlobalThemeDiscovery = { themes: ThemeEntry[]; errors: string[] };

export function discoverGlobalThemes(): GlobalThemeDiscovery {
  const errors: string[] = [];
  const themes: ThemeEntry[] = [];
  for (const [globPath, raw] of Object.entries(globalThemeYamls)) {
    const match = globPath.match(/themes\/([^/]+)\.yaml$/);
    const id = match?.[1];
    if (id === undefined) continue;
    const tokens = parseYamlFile(raw, themeSchema, `themes/${id}.yaml`, errors);
    if (tokens) themes.push({ key: `g:${id}`, id, scope: "global", tokens });
  }
  return { themes: themes.toSorted((a, b) => a.id.localeCompare(b.id)), errors };
}
