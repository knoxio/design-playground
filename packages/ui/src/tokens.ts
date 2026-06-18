import { z } from "zod";

/**
 * A theme: one client design system as a complete token set. Authored as
 * `clients/<id>/themes/<theme-id>.yaml`, validated with `themeSchema`,
 * applied as scoped CSS variables via `tokensToStyle`.
 *
 * Themes are scoped, never global: the variable block lands on the prototype
 * canvas element only. The app chrome keeps the static `:root` defaults and
 * is never themed by a client.
 *
 * Schema changes here are breaking changes to every theme YAML on disk —
 * core-owner territory, never extended for one client.
 */

const cssColor = z
  .string()
  .min(1)
  .refine((v) => typeof CSS === "undefined" || CSS.supports("color", v), {
    message: "not a valid CSS color",
  });

const cssLength = z.string().min(1);

const typeStep = z.object({ size: cssLength, lineHeight: cssLength });

export const themeSchema = z.object({
  colors: z.object({
    background: cssColor,
    foreground: cssColor,
    surface: cssColor,
    primary: cssColor,
    "primary-foreground": cssColor,
    muted: cssColor,
    "muted-foreground": cssColor,
    accent: cssColor,
    "accent-foreground": cssColor,
    border: cssColor,
    ring: cssColor,
    destructive: cssColor,
    "destructive-foreground": cssColor,
  }),
  type: z.object({
    sans: z.string().min(1),
    mono: z.string().min(1),
    numbers: z.enum(["proportional", "tabular"]),
    scale: z.object({
      xs: typeStep,
      sm: typeStep,
      base: typeStep,
      lg: typeStep,
      xl: typeStep,
      "2xl": typeStep,
      "3xl": typeStep,
    }),
  }),
  density: z.enum(["compact", "regular", "spacious"]),
  radii: z.object({ sm: cssLength, md: cssLength, lg: cssLength }),
  shadows: z.object({ sm: z.string().min(1), md: z.string().min(1), lg: z.string().min(1) }),
});

export type TokenSet = z.infer<typeof themeSchema>;

export type TokenCSSVariables = Record<`--${string}`, string>;

const densityToSpacing: Record<TokenSet["density"], string> = {
  compact: "0.2rem",
  regular: "0.25rem",
  spacious: "0.3rem",
};

export function spacingForDensity(density: TokenSet["density"]): string {
  return densityToSpacing[density];
}

export const helixTokens: TokenSet = {
  colors: {
    background: "#F5F5F7",
    foreground: "#1D1D23",
    surface: "#ffffff",
    primary: "#15B800",
    "primary-foreground": "#07210B",
    muted: "#E8E8ED",
    "muted-foreground": "#5A5A64",
    accent: "#EDFFF4",
    "accent-foreground": "#0E8C00",
    border: "#D2D2D9",
    ring: "#15B800",
    destructive: "#dc2626",
    "destructive-foreground": "#ffffff",
  },
  type: {
    sans: '"DM Sans Variable", system-ui, sans-serif',
    mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
    numbers: "proportional",
    scale: {
      xs: { size: "0.75rem", lineHeight: "1rem" },
      sm: { size: "0.875rem", lineHeight: "1.25rem" },
      base: { size: "1rem", lineHeight: "1.5rem" },
      lg: { size: "1.125rem", lineHeight: "1.75rem" },
      xl: { size: "1.25rem", lineHeight: "1.75rem" },
      "2xl": { size: "1.5rem", lineHeight: "2rem" },
      "3xl": { size: "1.875rem", lineHeight: "2.25rem" },
    },
  },
  density: "regular",
  radii: { sm: "0.25rem", md: "0.5rem", lg: "0.75rem" },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  },
};

export function tokensToStyle(tokens: TokenSet): TokenCSSVariables {
  const style: TokenCSSVariables = {};
  for (const [key, value] of Object.entries(tokens.colors)) {
    style[`--color-${key}`] = value;
  }
  style["--font-sans"] = tokens.type.sans;
  style["--font-mono"] = tokens.type.mono;
  for (const [step, { size, lineHeight }] of Object.entries(tokens.type.scale)) {
    style[`--text-${step}`] = size;
    style[`--text-${step}--line-height`] = lineHeight;
  }
  style["--spacing"] = densityToSpacing[tokens.density];
  for (const [key, value] of Object.entries(tokens.radii)) {
    style[`--radius-${key}`] = value;
  }
  for (const [key, value] of Object.entries(tokens.shadows)) {
    style[`--shadow-${key}`] = value;
  }
  return style;
}
