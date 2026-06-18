/**
 * Mechanical handoff artifacts (PRD-07): tokens.json, components.md,
 * real-vs-mocked.md skeleton, and screens/ for one client, written to
 * clients/<id>/handoff/. Judgment artifacts (prd.md finalization, the
 * reviewed real-vs-mocked) belong to the /handoff skill, which drives
 * this script. Runnable by a human with no session: `pnpm handoff <id>`.
 * Screenshots need the dev server on :3003 and a local Chrome.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

const repoRoot = new URL("..", import.meta.url).pathname;
const clientId = process.argv[2];

if (!clientId || !existsSync(join(repoRoot, "clients", clientId, "client.yaml"))) {
  console.error("usage: pnpm handoff <client-id>");
  process.exit(1);
}

const clientDir = join(repoRoot, "clients", clientId);
const handoffDir = join(clientDir, "handoff");
mkdirSync(join(handoffDir, "screens"), { recursive: true });

const clientYaml = parseYaml(readFileSync(join(clientDir, "client.yaml"), "utf8"));

function listFiles(dir, suffix) {
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(suffix)) : [];
}

const DENSITY_SPACING = { compact: "0.2rem", regular: "0.25rem", spacious: "0.3rem" };

function px(value) {
  if (value === undefined || value === "") return "0px";
  return /^-?[\d.]+$/.test(value) ? `${value}px` : value;
}

/**
 * One CSS shadow layer ("0 2px 4px -1px rgb(15 23 42 / 0.08)") as a DTCG
 * shadow object. Unparseable layers fall back to the raw string under
 * $extensions so nothing is silently dropped.
 */
function parseShadowLayer(layer) {
  const match = layer
    .trim()
    .match(
      /^(-?[\d.]+(?:px|rem)?)\s+(-?[\d.]+(?:px|rem)?)\s+(-?[\d.]+(?:px|rem)?)\s*(-?[\d.]+(?:px|rem)?)?\s*(rgb.*|#\S+)$/,
    );
  if (!match) return null;
  return {
    offsetX: px(match[1]),
    offsetY: px(match[2]),
    blur: px(match[3]),
    spread: px(match[4]),
    color: match[5],
  };
}

function dtcgShadow(value) {
  const layers = value.split(/,(?![^(]*\))/).map(parseShadowLayer);
  if (layers.some((l) => l === null)) {
    return { $type: "shadow", $value: [], $extensions: { "co.helix.css": value } };
  }
  return { $type: "shadow", $value: layers };
}

function fontList(value) {
  return value.split(",").map((f) => f.trim().replace(/^["']|["']$/g, ""));
}

function group(entries, type) {
  return Object.fromEntries(
    Object.entries(entries).map(([k, v]) => [k, { $type: type, $value: v }]),
  );
}

/** The theme as a W3C DTCG token document — the cross-tool interchange format engineers' pipelines ingest directly. */
function toDtcg(tokens) {
  return {
    $description:
      `Design tokens for ${clientYaml.name}, exported from the approved prototype theme ` +
      `"${clientYaml.defaultTheme}". W3C DTCG format; spacing utilities are calc(spacing.base × n).`,
    color: group(tokens.colors, "color"),
    font: {
      sans: { $type: "fontFamily", $value: fontList(tokens.type.sans) },
      mono: { $type: "fontFamily", $value: fontList(tokens.type.mono) },
      $extensions: { "co.helix.numericVariant": tokens.type.numbers },
    },
    typeScale: Object.fromEntries(
      Object.entries(tokens.type.scale).map(([step, { size, lineHeight }]) => [
        step,
        { $type: "typography", $value: { fontSize: size, lineHeight } },
      ]),
    ),
    spacing: {
      base: { $type: "dimension", $value: DENSITY_SPACING[tokens.density] },
      $description: `Resolved from density "${tokens.density}".`,
    },
    radius: group(tokens.radii, "dimension"),
    shadow: Object.fromEntries(Object.entries(tokens.shadows).map(([k, v]) => [k, dtcgShadow(v)])),
  };
}

function writeTokens() {
  const themeId = clientYaml.defaultTheme;
  const themePath = join(clientDir, "themes", `${themeId}.yaml`);
  const tokens = parseYaml(readFileSync(themePath, "utf8"));
  writeFileSync(join(handoffDir, "tokens.json"), `${JSON.stringify(toDtcg(tokens), null, 2)}\n`);
  console.log(`tokens.json (theme: ${themeId}, DTCG)`);
}

function collectTagProps(tagAttrs, props) {
  for (const attr of tagAttrs.matchAll(/(?:^|\s)([a-zA-Z][\w-]*)\s*(?==)/g)) {
    if (attr[1] !== "key" && attr[1] !== "ref") props.add(attr[1]);
  }
}

function collectKitUsage(files) {
  const sources = files.map((file) => readFileSync(file, "utf8"));
  const used = new Map();
  for (const source of sources) {
    for (const match of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*"@helix\/ui"/g)) {
      for (const raw of match[1].split(",")) {
        const name = raw.trim().replace(/\s+as\s+.*$/, "");
        if (/^[A-Z]/.test(name) && !used.has(name)) used.set(name, new Set());
      }
    }
  }
  for (const source of sources) {
    for (const [name, props] of used) {
      for (const tag of source.matchAll(new RegExp(`<${name}([^>]*?)/?>`, "g"))) {
        collectTagProps(tag[1], props);
      }
    }
  }
  return [...used.entries()]
    .map(([name, props]) => ({ name, props: [...props].toSorted() }))
    .toSorted((a, b) => a.name.localeCompare(b.name));
}

function writeComponents() {
  const pageFiles = listFiles(join(clientDir, "pages"), ".tsx").map((f) =>
    join(clientDir, "pages", f),
  );
  const componentFiles = listFiles(join(clientDir, "components"), ".tsx").map((f) =>
    join(clientDir, "components", f),
  );
  const kit = collectKitUsage([...pageFiles, ...componentFiles]);
  const lines = [
    `# Component inventory — ${clientYaml.name}`,
    "",
    "## Shared kit components used",
    "",
    ...kit.map(
      ({ name, props }) =>
        `- \`${name}\` — props used: ${props.length > 0 ? props.map((p) => `\`${p}\``).join(", ") : "defaults only"}`,
    ),
    "",
    "## Client components",
    "",
  ];
  if (componentFiles.length === 0) lines.push("None.");
  for (const file of componentFiles) {
    const source = readFileSync(file, "utf8");
    const name = file.split("/").at(-1);
    const candidate = source.includes("export const promoteCandidate = true");
    lines.push(`- \`components/${name}\`${candidate ? " — **promotion candidate**" : ""}`);
  }
  writeFileSync(join(handoffDir, "components.md"), `${lines.join("\n")}\n`);
  console.log(`components.md (${kit.length} kit, ${componentFiles.length} client)`);
}

function writeRealVsMocked() {
  const dataFiles = listFiles(join(clientDir, "data"), ".ts");
  const lines = [
    `# Real vs. mocked — ${clientYaml.name}`,
    "",
    "> Generated skeleton. REVIEW REQUIRED before handoff: every TODO below",
    "> must be replaced with a verified statement or deleted.",
    "",
    "## Mock data sources (everything below is fictional)",
    "",
    ...dataFiles.map((f) => `- \`data/${f}\``),
    "",
    "## Standard illusions in every prototype",
    "",
    "- No authentication, sessions, or permissions — every page is reachable",
    "- All interactions are instant; real APIs have latency and failure modes",
    "- Nothing persists: forms do not submit, edits do not save",
    "- No loading, empty, or error states unless explicitly prototyped",
    "",
    "## Engagement-specific illusions",
    "",
    "- TODO: list flows that look functional but are static",
    "- TODO: list any constraint promised in the brief that the UI must not imply",
  ];
  writeFileSync(join(handoffDir, "real-vs-mocked.md"), `${lines.join("\n")}\n`);
  console.log(`real-vs-mocked.md (${dataFiles.length} mock data files; review required)`);
}

async function writeScreens() {
  const probe = await fetch("http://localhost:3003").catch(() => null);
  if (!probe?.ok) {
    console.error("screens skipped: dev server not running on :3003 (pnpm dev)");
    return false;
  }
  const { chromium } = await import("playwright-core");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const pages = listFiles(join(clientDir, "pages"), ".tsx").map((f) => f.replace(".tsx", ""));
  for (const id of pages) {
    // The chrome-less frame route: product canvas only, no playground UI.
    await page.goto(`http://localhost:3003/frame/c/${clientId}/p/${id}`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: join(handoffDir, "screens", `${id}.png`), fullPage: true });
    console.log(`screens/${id}.png`);
  }
  await browser.close();
  return true;
}

writeTokens();
writeComponents();
writeRealVsMocked();
const screensDone = await writeScreens();
execSync(`pnpm format:dir clients/${clientId}/handoff`, { cwd: repoRoot, stdio: "ignore" });
console.log(
  screensDone
    ? `handoff artifacts written to clients/${clientId}/handoff/`
    : `handoff artifacts written (screens pending a running dev server)`,
);
