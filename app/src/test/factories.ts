import type { TokenSet } from "@helix/ui";
import { createElement } from "react";
import type {
  ClientEntry,
  ExperimentEntry,
  PageEntry,
  ThemeEntry,
  ThemeScope,
  VariantEntry,
} from "../registry/types";

/**
 * Test fixtures for the registry/shell unit tests. Real (not cast) objects so
 * the suites honour the no-`as any` rule and stay aligned with the types they
 * exercise. Only imported by `*.test.ts`, so never reaches a build.
 */

export function makeTokenSet(): TokenSet {
  const step = { size: "1rem", lineHeight: "1.5rem" };
  return {
    colors: {
      background: "#fff",
      foreground: "#000",
      surface: "#fafafa",
      primary: "#0a0",
      "primary-foreground": "#fff",
      muted: "#eee",
      "muted-foreground": "#666",
      accent: "#00f",
      "accent-foreground": "#fff",
      border: "#ddd",
      ring: "#0a0",
      destructive: "#f00",
      "destructive-foreground": "#fff",
    },
    type: {
      sans: "Inter",
      mono: "JetBrains Mono",
      numbers: "tabular",
      scale: { xs: step, sm: step, base: step, lg: step, xl: step, "2xl": step, "3xl": step },
    },
    density: "regular",
    radii: { sm: "2px", md: "6px", lg: "12px" },
    shadows: { sm: "0 1px 2px", md: "0 2px 6px", lg: "0 8px 24px" },
  };
}

export function makeTheme(id: string, scope: ThemeScope, key = `${scope}:${id}`): ThemeEntry {
  return { key, id, scope, tokens: makeTokenSet() };
}

export function makePage(overrides: Partial<PageEntry> & { id: string }): PageEntry {
  return {
    title: overrides.id,
    order: 0,
    component: () => createElement("div"),
    experiments: [],
    ...overrides,
  };
}

export function makeVariant(overrides: Partial<VariantEntry> & { id: string }): VariantEntry {
  return { name: overrides.id, pages: [], themes: [], ...overrides };
}

export function makeExperiment(
  overrides: Partial<ExperimentEntry> & { id: string },
): ExperimentEntry {
  return {
    name: overrides.id,
    status: "active",
    page: overrides.id,
    themes: [],
    components: [],
    variants: [],
    ...overrides,
  };
}

export function makeClient(overrides: Partial<ClientEntry> & { id: string }): ClientEntry {
  return {
    name: overrides.id,
    themes: [],
    defaultTheme: "default",
    pages: [],
    components: [],
    experiments: [],
    errors: [],
    ...overrides,
  };
}
