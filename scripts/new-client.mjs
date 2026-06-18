/**
 * The deterministic half of /new-client: scaffold a contract-valid client
 * folder. `clientScaffold` returns the file tree as a pure map (path → content)
 * so it can be unit-tested; the CLI writes it, copying the Helix standard theme
 * as the client's default. The skill owns the judgment (theme direction, brief
 * content); this owns the mechanics.
 * Usage: `pnpm new-client <id> "<Display Name>"`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const ID_RE = /^[a-z][a-z0-9-]*$/;

function brief(name) {
  return `# ${name} — Client Brief

> Generated from the kickoff transcript where possible; keep current as the
> engagement evolves. Read before any prototyping work for this client.

## Who they are

TODO

## The problem

TODO

## Agreed scope

- TODO

## Out of scope

- TODO

## Design system decisions

- TODO — see \`themes/default.yaml\`

## Vocabulary

- TODO (terms to use / terms to avoid)

## Key people

- TODO

## Open questions

- TODO

## Decision log

(append-only; one line per decided experiment)
`;
}

const HOME_PAGE = `import type { PageMeta } from "@helix/ui";

export const meta: PageMeta = { title: "Home", order: 1 };

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">Home</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        New client — start prototyping here.
      </p>
    </div>
  );
}
`;

/**
 * Build the scaffold for a client as a map of client-relative path → content.
 * `themeYaml` is the default theme to seed (the Helix standard or a fork).
 */
export function clientScaffold({ id, name, themeYaml }) {
  if (!ID_RE.test(id)) throw new Error(`invalid client id "${id}" — kebab-case required`);
  if (!name) throw new Error("client name is required");
  return {
    "client.yaml": `name: ${name}\ndefaultTheme: default\n`,
    "themes/default.yaml": themeYaml,
    "CLAUDE.md": brief(name),
    "pages/home.tsx": HOME_PAGE,
    "components/.gitkeep": "",
    "data/.gitkeep": "",
    "docs/.gitkeep": "",
  };
}

/** Write the scaffold under `<repoRoot>/clients/<id>`, refusing to overwrite. */
export function writeClient(repoRoot, { id, name }, themeYaml) {
  const dir = path.join(repoRoot, "clients", id);
  if (existsSync(dir)) throw new Error(`client "${id}" already exists`);
  const files = clientScaffold({ id, name, themeYaml });
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return dir;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [id, name] = process.argv.slice(2);
  if (!id || !name) {
    console.error('usage: pnpm new-client <id> "<Display Name>"');
    process.exit(1);
  }
  const themeYaml = readFileSync(path.join(REPO_ROOT, "themes/helix.yaml"), "utf8");
  const dir = writeClient(REPO_ROOT, { id, name }, themeYaml);
  console.log(`✓ scaffolded ${path.relative(REPO_ROOT, dir)}`);
}
