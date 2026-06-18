import { designTokens, type TokenSet } from "@design/ui";
import { globalThemes } from "../registry/clients";
import { DESIGN_STANDARD_THEME, type ClientEntry, type ThemeEntry } from "../registry/types";

type ResolveThemeArgs = {
  client: ClientEntry;
  experimentId?: string;
  variantId?: string;
  /** Galleries evaluate: they expose every theme of the client across scopes. */
  isGallery: boolean;
  overrideKey?: string;
};

type ResolvedTheme = {
  themeOptions: ThemeEntry[];
  currentThemeKey: string;
  tokens: TokenSet;
};

function keyOf(themes: ThemeEntry[], id: string | undefined): string | undefined {
  if (id === undefined) return undefined;
  return themes.find((t) => t.id === id)?.key;
}

function allScopedThemes(client: ClientEntry): ThemeEntry[] {
  return client.experiments
    .filter((e) => e.status === "active")
    .flatMap((e) => [...e.themes, ...e.variants.flatMap((v) => v.themes)]);
}

export function resolveTheme({
  client,
  experimentId,
  variantId,
  isGallery,
  overrideKey,
}: ResolveThemeArgs): ResolvedTheme {
  const experiment = client.experiments.find((e) => e.id === experimentId);
  const variant = experiment?.variants.find((v) => v.id === variantId);

  const scopedThemes: ThemeEntry[] = isGallery
    ? allScopedThemes(client)
    : [...(experiment?.themes ?? []), ...(variant?.themes ?? [])];
  const themeOptions = [...client.themes, ...scopedThemes, ...globalThemes];

  const validOverride = themeOptions.some((t) => t.key === overrideKey) ? overrideKey : undefined;
  const experimentBaseKey = experiment
    ? keyOf([...experiment.themes, ...client.themes, ...globalThemes], experiment.theme)
    : undefined;
  const defaultKey = keyOf([...client.themes, ...globalThemes], client.defaultTheme);

  const currentThemeKey = validOverride ?? experimentBaseKey ?? defaultKey ?? DESIGN_STANDARD_THEME;
  const tokens = themeOptions.find((t) => t.key === currentThemeKey)?.tokens ?? designTokens;
  return { themeOptions, currentThemeKey, tokens };
}
