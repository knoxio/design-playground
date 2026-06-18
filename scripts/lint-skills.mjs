/**
 * Static lint for every `.claude/skills/<id>/SKILL.md`: required frontmatter is
 * present and the `name` matches the directory, and every concrete repo path the
 * skill references actually exists. Cheap insurance against skill rot — a skill
 * that points at a moved doc or a renamed script fails CI here.
 * Usage: `pnpm lint:skills` — non-zero exit on any problem.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

// A token is a checkable repo path when it starts with one of these — concrete
// core files, never client-relative placeholders like `clients/<id>/pages/`.
const ROOT_PREFIXES = ["docs/", "scripts/", "packages/", "app/", "themes/", ".github/", "e2e/"];
// `.env` is gitignored — absent in a clean CI checkout — so only its committed
// example is a checkable reference.
const ROOT_EXACT = new Set([".mcp.json", ".env.example"]);

function isPlaceholder(token) {
  return /[<>*$\s()]/.test(token);
}

function backtickPaths(body) {
  const refs = [];
  for (const match of body.matchAll(/`([^`]+)`/g)) {
    const token = match[1];
    if (isPlaceholder(token)) continue;
    if (ROOT_EXACT.has(token) || ROOT_PREFIXES.some((p) => token.startsWith(p))) {
      refs.push({ raw: token, base: "root" });
    }
  }
  return refs;
}

function markdownLinks(body) {
  const refs = [];
  for (const match of body.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    if (target.startsWith("./") || target.startsWith("../"))
      refs.push({ raw: target, base: "skill" });
    else if (ROOT_EXACT.has(target) || ROOT_PREFIXES.some((p) => target.startsWith(p)))
      refs.push({ raw: target, base: "root" });
  }
  return refs;
}

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  const block = match?.[1] ?? "";
  const field = (key) => block.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? "";
  return {
    name: field("name"),
    description: field("description"),
    body: text.slice(match?.[0].length ?? 0),
  };
}

/** Drop fenced code blocks — their paths are illustrative templates, not refs. */
function stripFences(body) {
  return body.replace(/```[\s\S]*?```/g, "");
}

/** Lint one skill's parsed content; `skillDir` is its absolute directory. */
export function lintSkillContent({ dirName, name, description, body, skillDir, repoRoot }) {
  const errors = [];
  if (!name) errors.push(`${dirName}: missing frontmatter \`name\``);
  else if (name !== dirName)
    errors.push(`${dirName}: frontmatter name "${name}" must match directory`);
  if (!description) errors.push(`${dirName}: missing frontmatter \`description\``);

  const prose = stripFences(body);
  for (const ref of [...markdownLinks(prose), ...backtickPaths(prose)]) {
    const abs =
      ref.base === "skill" ? path.resolve(skillDir, ref.raw) : path.resolve(repoRoot, ref.raw);
    if (!existsSync(abs)) errors.push(`${dirName}: references missing path \`${ref.raw}\``);
  }
  return errors;
}

/** Lint every skill under `skillsDir`. Returns a flat list of error strings. */
export function lintSkills(
  skillsDir = path.join(REPO_ROOT, ".claude/skills"),
  repoRoot = REPO_ROOT,
) {
  const errors = [];
  for (const dirName of readdirSync(skillsDir)) {
    const file = path.join(skillsDir, dirName, "SKILL.md");
    if (!existsSync(file)) {
      errors.push(`${dirName}: no SKILL.md`);
      continue;
    }
    const { name, description, body } = parseFrontmatter(readFileSync(file, "utf8"));
    errors.push(
      ...lintSkillContent({
        dirName,
        name,
        description,
        body,
        skillDir: path.join(skillsDir, dirName),
        repoRoot,
      }),
    );
  }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = lintSkills();
  if (errors.length > 0) {
    console.error(`✗ skill lint found ${errors.length} problem(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log("✓ skills lint clean");
}
