/**
 * PRD-06 acceptance gate: every VITE_CLIENT-scoped build must physically
 * exclude all other clients and the inspect-mode source stamps. Builds each
 * client's preview and scans dist/ for any other client's path fragment,
 * route prefix, or display name, plus data-dp-source. Exits non-zero on any
 * leak. Run via `pnpm verify:scoped` (part of `pnpm run ci`).
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("..", import.meta.url).pathname;
const clientsDir = join(repoRoot, "clients");
const distDir = join(repoRoot, "app", "dist");

const clients = readdirSync(clientsDir)
  .filter((id) => existsSync(join(clientsDir, id, "client.yaml")))
  .map((id) => {
    const yaml = readFileSync(join(clientsDir, id, "client.yaml"), "utf8");
    const name = yaml.match(/^name:\s*["']?(.+?)["']?\s*$/m)?.[1];
    return { id, name };
  });

if (clients.length === 0) {
  console.log("verify-scoped-build: no clients found, nothing to verify");
  process.exit(0);
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

function leaksIn(scopedId) {
  const others = clients.filter((c) => c.id !== scopedId);
  const markers = [
    // The attribute name alone ships legitimately (the comments overlay
    // queries it); stamped values — compiled JSX props — must not.
    { label: "inspect source stamp", needle: 'data-dp-source":' },
    ...others.flatMap((other) => [
      { label: `path of client "${other.id}"`, needle: `clients/${other.id}` },
      { label: `route of client "${other.id}"`, needle: `/c/${other.id}/` },
      ...(other.name ? [{ label: `name of client "${other.id}"`, needle: other.name }] : []),
    ]),
  ];
  const leaks = [];
  for (const file of walk(distDir)) {
    if (/\.(woff2?|png|jpg|ico|svg)$/.test(file)) continue;
    const content = readFileSync(file, "utf8");
    for (const marker of markers) {
      if (content.includes(marker.needle)) {
        leaks.push(`${file.replace(repoRoot, "")}: contains ${marker.label} (${marker.needle})`);
      }
    }
  }
  return leaks;
}

let failed = false;
for (const client of clients) {
  execSync("pnpm --filter @design/app build", {
    cwd: repoRoot,
    stdio: ["ignore", "ignore", "inherit"],
    env: { ...process.env, VITE_CLIENT: client.id },
  });
  const leaks = leaksIn(client.id);
  if (leaks.length > 0) {
    failed = true;
    console.error(`✗ scoped build for "${client.id}" leaks:`);
    for (const leak of leaks) console.error(`  ${leak}`);
  } else {
    console.log(`✓ scoped build for "${client.id}" contains no other client and no source stamps`);
  }
}

process.exit(failed ? 1 : 0);
