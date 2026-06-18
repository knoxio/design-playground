import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { describe, expect, it } from "vitest";
import { themeSchema } from "../packages/ui/src/tokens.ts";
import { dtcgToTheme } from "./dtcg-to-theme.mjs";

/**
 * The deterministic half of /theme-from-figma. A DTCG document must convert to
 * a theme that passes `themeSchema`, and any group the document omits must fall
 * back to the Helix standard with a review warning — never silently invented.
 * This closes the "shipped but unvalidated" gap on the Figma import path.
 */

const fallback = parseYaml(readFileSync(new URL("../themes/helix.yaml", import.meta.url), "utf8"));

const color = (v) => ({ $value: v });
const fullColor = Object.fromEntries(
  [
    "background",
    "foreground",
    "surface",
    "primary",
    "primary-foreground",
    "muted",
    "muted-foreground",
    "accent",
    "accent-foreground",
    "border",
    "ring",
    "destructive",
    "destructive-foreground",
  ].map((k) => [k, color("#123456")]),
);

const step = (size, lh) => ({ $value: { fontSize: size, lineHeight: lh } });
const fullScale = {
  xs: step("0.75rem", "1rem"),
  sm: step("0.875rem", "1.25rem"),
  base: step("1rem", "1.5rem"),
  lg: step("1.125rem", "1.75rem"),
  xl: step("1.25rem", "1.75rem"),
  "2xl": step("1.5rem", "2rem"),
  "3xl": step("1.875rem", "2.25rem"),
};

const completeDoc = {
  color: fullColor,
  font: {
    sans: { $value: ["Inter", "sans serif"] },
    mono: { $value: ["JetBrains Mono"] },
    $extensions: { "co.helix.numericVariant": "tabular" },
  },
  typeScale: fullScale,
  spacing: { base: { $value: "0.2rem" } },
  radius: { sm: color("3px"), md: color("7px"), lg: color("14px") },
  shadow: {
    sm: { $value: { offsetX: "0px", offsetY: "1px", blur: "2px", color: "#0000001a" } },
    md: { $value: { offsetX: "0px", offsetY: "2px", blur: "6px", color: "#00000022" } },
    lg: { $value: { offsetX: "0px", offsetY: "8px", blur: "24px", color: "#00000033" } },
  },
};

describe("dtcgToTheme", () => {
  it("converts a complete DTCG document to a theme that passes themeSchema", () => {
    const { theme, warnings } = dtcgToTheme(completeDoc, fallback);
    expect(warnings).toEqual([]);
    const parsed = themeSchema.safeParse(theme);
    expect(parsed.success).toBe(true);
    expect(theme.type.sans).toBe('Inter, "sans serif"');
    expect(theme.type.numbers).toBe("tabular");
    expect(theme.density).toBe("compact");
    expect(theme.radii).toEqual({ sm: "3px", md: "7px", lg: "14px" });
    expect(theme.shadows.sm).toBe("0px 1px 2px 0px #0000001a");
  });

  it("falls back to the Helix standard with a review warning for a missing group", () => {
    const { color: _omit, ...withoutColor } = completeDoc;
    const { theme, warnings } = dtcgToTheme(withoutColor, fallback);
    expect(themeSchema.safeParse(theme).success).toBe(true);
    expect(theme.colors).toEqual(fallback.colors);
    expect(warnings.some((w) => w.startsWith("colors:"))).toBe(true);
  });

  it("warns when spacing.base matches no density and defaults to regular", () => {
    const doc = { ...completeDoc, spacing: { base: { $value: "0.42rem" } } };
    const { theme, warnings } = dtcgToTheme(doc, fallback);
    expect(theme.density).toBe("regular");
    expect(warnings.some((w) => w.startsWith("density:"))).toBe(true);
  });
});
