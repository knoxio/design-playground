import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { describe, expect, it } from "vitest";
import { themeSchema } from "../packages/ui/src/tokens.ts";
import { clientScaffold, writeClient } from "./new-client.mjs";

/**
 * The deterministic mechanics of /new-client (layer 2): from a fixture repo
 * state, the scaffold must produce a fixed, contract-shaped file tree whose
 * YAML validates against the schemas. Proves the contract-shaped half of the
 * skill is a test, not a hope — the same pattern extends to the other
 * mechanical skills.
 */

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const designTheme = readFileSync(path.join(repoRoot, "themes/design.yaml"), "utf8");

describe("clientScaffold", () => {
  it("produces the contract's file tree", () => {
    const files = clientScaffold({ id: "acme", name: "Acme Co", themeYaml: designTheme });
    expect(Object.keys(files).toSorted()).toEqual([
      "CLAUDE.md",
      "client.yaml",
      "components/.gitkeep",
      "data/.gitkeep",
      "docs/.gitkeep",
      "pages/home.tsx",
      "themes/default.yaml",
    ]);
  });

  it("writes a client.yaml with the name and default theme", () => {
    const files = clientScaffold({ id: "acme", name: "Acme Co", themeYaml: designTheme });
    const parsed = parseYaml(files["client.yaml"]);
    expect(parsed).toMatchObject({ name: "Acme Co", defaultTheme: "default" });
  });

  it("seeds a default theme that passes themeSchema", () => {
    const files = clientScaffold({ id: "acme", name: "Acme Co", themeYaml: designTheme });
    expect(themeSchema.safeParse(parseYaml(files["themes/default.yaml"])).success).toBe(true);
  });

  it("scaffolds a home page with meta and a default export", () => {
    const files = clientScaffold({ id: "acme", name: "Acme Co", themeYaml: designTheme });
    expect(files["pages/home.tsx"]).toContain('export const meta: PageMeta = { title: "Home"');
    expect(files["pages/home.tsx"]).toContain("export default function Home(");
  });

  it("rejects a non-kebab-case id and an empty name", () => {
    expect(() => clientScaffold({ id: "Acme", name: "x", themeYaml: designTheme })).toThrow();
    expect(() => clientScaffold({ id: "acme", name: "", themeYaml: designTheme })).toThrow();
  });
});

describe("writeClient", () => {
  it("writes the tree to disk and refuses to overwrite", () => {
    const root = mkdtempSync(path.join(tmpdir(), "dp-new-client-"));
    // Seed a minimal repo state the script reads (the Design standard theme).
    writeClient(root, { id: "acme", name: "Acme Co" }, designTheme);
    const dir = path.join(root, "clients", "acme");
    expect(readdirSync(dir).toSorted()).toContain("client.yaml");
    expect(() => writeClient(root, { id: "acme", name: "Acme Co" }, designTheme)).toThrow(
      /already exists/,
    );
  });
});
