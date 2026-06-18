/**
 * W3C DTCG token document → playground theme YAML, the reverse of the
 * handoff export. The deterministic half of /theme-from-figma: the skill
 * massages whatever Figma/Tokens Studio produced into this profile
 * (color, font, typeScale, spacing, radius, shadow groups), then this
 * converts. Missing groups fall back to the Helix standard with a
 * `# review:` comment so nothing is silently invented.
 * Usage: `pnpm dtcg-to-theme <tokens.json>` — YAML on stdout.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse as parseYaml, stringify } from "yaml";

const HELIX_STANDARD = new URL("../themes/helix.yaml", import.meta.url).pathname;
const DENSITY_SPACING = { compact: "0.2rem", regular: "0.25rem", spacious: "0.3rem" };

function values(group) {
  return Object.fromEntries(
    Object.entries(group ?? {})
      .filter(([k, v]) => !k.startsWith("$") && v && typeof v === "object" && "$value" in v)
      .map(([k, v]) => [k, v.$value]),
  );
}

function fontString(value) {
  if (!Array.isArray(value)) return String(value);
  return value.map((f) => (/\s/.test(f) ? `"${f}"` : f)).join(", ");
}

function shadowCss(value) {
  const layers = Array.isArray(value) ? value : [value];
  return layers
    .map((l) => `${l.offsetX} ${l.offsetY} ${l.blur} ${l.spread ?? "0px"} ${l.color}`.trim())
    .join(", ");
}

function density(spacingGroup, warnings) {
  const base = spacingGroup?.base?.$value;
  const match = Object.entries(DENSITY_SPACING).find(([, v]) => v === base);
  if (match) return match[0];
  warnings.push(`density: spacing.base ${base ?? "missing"} matches no density — "regular" used`);
  return "regular";
}

function typeScale(group, fallback) {
  const scale = {};
  for (const [step, token] of Object.entries(group ?? {})) {
    if (step.startsWith("$")) continue;
    const v = token.$value ?? {};
    scale[step] = { size: v.fontSize, lineHeight: v.lineHeight };
  }
  return Object.keys(scale).length > 0 ? scale : fallback.type.scale;
}

/**
 * Convert a DTCG token document into a playground theme object, using
 * `fallback` (the Helix standard) for any group the document omits. Returns
 * `{ theme, warnings }`; pure, so the CLI and the tests share one path.
 */
export function dtcgToTheme(doc, fallback) {
  const warnings = [];
  const fallbackFor = (name) => {
    warnings.push(`${name}: not in the DTCG document — Helix standard used`);
    return fallback[name];
  };

  const colors = values(doc.color);
  const radii = values(doc.radius);
  const shadows = values(doc.shadow);
  const theme = {
    colors: Object.keys(colors).length > 0 ? colors : fallbackFor("colors"),
    type: {
      sans: doc.font?.sans ? fontString(doc.font.sans.$value) : fallbackFor("type").sans,
      mono: doc.font?.mono ? fontString(doc.font.mono.$value) : fallback.type.mono,
      numbers: doc.font?.$extensions?.["co.helix.numericVariant"] ?? "proportional",
      scale: typeScale(doc.typeScale, fallback),
    },
    density: density(doc.spacing, warnings),
    radii: Object.keys(radii).length > 0 ? radii : fallbackFor("radii"),
    shadows:
      Object.keys(shadows).length > 0
        ? Object.fromEntries(Object.entries(shadows).map(([k, v]) => [k, shadowCss(v)]))
        : fallbackFor("shadows"),
  };
  return { theme, warnings };
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("usage: pnpm dtcg-to-theme <tokens.json>");
    process.exit(1);
  }
  const doc = JSON.parse(readFileSync(inputPath, "utf8"));
  const fallback = parseYaml(readFileSync(HELIX_STANDARD, "utf8"));
  const { theme, warnings } = dtcgToTheme(doc, fallback);
  const header = [
    `# Imported from a DTCG token document (${inputPath.split("/").at(-1)}) via /theme-from-figma.`,
    ...warnings.map((w) => `# review: ${w}`),
  ];
  process.stdout.write(`${header.join("\n")}\n${stringify(theme)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
