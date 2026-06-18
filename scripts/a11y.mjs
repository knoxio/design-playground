/**
 * On-demand WCAG audit for a client's prototype: axe-core against every
 * main page through the chrome-less frame route, under the client's
 * default theme. Scores, never blocks (exit 0 regardless) — the playground
 * ships what was designed; this surfaces what to look at.
 * Usage: `pnpm a11y <client-id>` with the dev server on :3003.
 */
import { createRequire } from "node:module";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("..", import.meta.url).pathname;
const clientId = process.argv[2];

if (!clientId || !existsSync(join(repoRoot, "clients", clientId, "client.yaml"))) {
  console.error("usage: pnpm a11y <client-id>");
  process.exit(1);
}

const probe = await fetch("http://localhost:3003").catch(() => null);
if (!probe?.ok) {
  console.error("dev server not running on :3003 (pnpm dev)");
  process.exit(1);
}

const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
const pagesDir = join(repoRoot, "clients", clientId, "pages");
const pages = readdirSync(pagesDir)
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => f.replace(".tsx", ""));

const { chromium } = await import("playwright-core");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const IMPACT_ORDER = ["critical", "serious", "moderate", "minor"];
let total = 0;

for (const id of pages) {
  await page.goto(`http://localhost:3003/frame/c/${clientId}/p/${id}`);
  await page.waitForLoadState("networkidle");
  await page.addScriptTag({ path: axePath });
  const results = await page.evaluate(() =>
    window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] },
    }),
  );
  const violations = results.violations.toSorted(
    (a, b) => IMPACT_ORDER.indexOf(a.impact) - IMPACT_ORDER.indexOf(b.impact),
  );
  total += violations.length;
  console.log(`\n${id} — ${violations.length === 0 ? "clean" : `${violations.length} finding(s)`}`);
  for (const v of violations) {
    console.log(`  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} element(s))`);
    for (const node of v.nodes.slice(0, 3)) console.log(`      ${node.target.join(" ")}`);
  }
}

await browser.close();
console.log(
  `\n${total === 0 ? "No WCAG 2.2 AA findings." : `${total} finding(s) across ${pages.length} page(s) — score, not a gate.`}`,
);
