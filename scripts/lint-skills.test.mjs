import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { lintSkillContent, lintSkills } from "./lint-skills.mjs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const skillDir = fileURLToPath(new URL("../.claude/skills/new-client", import.meta.url));

const base = {
  dirName: "demo",
  name: "demo",
  description: "does a thing",
  body: "",
  skillDir,
  repoRoot,
};

describe("lintSkills (real skills)", () => {
  it("every checked-in SKILL.md is clean", () => {
    expect(lintSkills()).toEqual([]);
  });
});

describe("lintSkillContent", () => {
  it("passes a well-formed skill", () => {
    expect(lintSkillContent(base)).toEqual([]);
  });

  it("flags a name that does not match the directory", () => {
    const errors = lintSkillContent({ ...base, name: "other" });
    expect(errors.some((e) => e.includes("must match directory"))).toBe(true);
  });

  it("flags missing frontmatter", () => {
    expect(lintSkillContent({ ...base, name: "" }).some((e) => e.includes("`name`"))).toBe(true);
    expect(
      lintSkillContent({ ...base, description: "" }).some((e) => e.includes("`description`")),
    ).toBe(true);
  });

  it("flags a referenced repo path that does not exist", () => {
    const body = "See `docs/reference/nope.md` for details.";
    expect(lintSkillContent({ ...base, body }).some((e) => e.includes("nope.md"))).toBe(true);
  });

  it("accepts a referenced repo path that exists", () => {
    const body = "The contract is `docs/reference/client-folder-contract.md`.";
    expect(lintSkillContent({ ...base, body })).toEqual([]);
  });

  it("ignores client-relative placeholders", () => {
    const body = "Write to `clients/<id>/pages/home.tsx` and `experiments/<e>/shared/`.";
    expect(lintSkillContent({ ...base, body })).toEqual([]);
  });

  it("ignores paths inside fenced code blocks (illustrative templates)", () => {
    const body = "Example:\n\n```yaml\nsee `docs/reference/made-up.md`\n```\n";
    expect(lintSkillContent({ ...base, body })).toEqual([]);
  });

  it("ignores the gitignored `.env` but checks `.env.example`", () => {
    expect(lintSkillContent({ ...base, body: "token from `.env`" })).toEqual([]);
    const missing = lintSkillContent({ ...base, body: "see `.env.nope`" });
    expect(missing).toEqual([]); // `.env.nope` is not a recognized checkable path
  });
});
