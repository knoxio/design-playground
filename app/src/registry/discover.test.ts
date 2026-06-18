import { describe, expect, it } from "vitest";
import { makeExperiment, makePage, makeVariant } from "../test/factories";
import { discoverClients } from "./discover";
import { linkExperimentsToPages } from "./lineage";
import { discoverGlobalThemes } from "./themes";
import type { ClientEntry } from "./types";

/**
 * The other half of the contract: cross-reference rules enforced by discovery
 * (a page needs a title, an experiment needs ≥1 variant, `chosen` must name a
 * real variant, `defaultTheme` and experiment themes must resolve). These run
 * against the real checked-in clients and assert the invariants hold for
 * *whatever* is on disk — so a skill or hand-edit that commits a
 * contract-violating folder fails CI here, without coupling the test to any
 * one client's page list.
 */

const globalThemes = discoverGlobalThemes();
const globalThemeIds = new Set(globalThemes.themes.map((t) => t.id));
const clients = discoverClients(globalThemeIds);
const contractErrors = clients.flatMap((c) => c.errors.map((e) => `${c.id}: ${e}`));

const themeIdsInScope = (client: ClientEntry): Set<string> =>
  new Set([...globalThemeIds, ...client.themes.map((t) => t.id)]);

describe("global themes", () => {
  it("discover without errors", () => {
    expect(globalThemes.errors).toEqual([]);
  });

  it("produce at least one theme", () => {
    expect(globalThemes.themes.length).toBeGreaterThan(0);
  });
});

describe("client discovery", () => {
  it("finds clients", () => {
    expect(clients.length).toBeGreaterThan(0);
  });

  it("every client parses with zero contract errors", () => {
    expect(contractErrors).toEqual([]);
  });
});

describe.each(clients.map((c) => [c.id, c] as const))("client %s", (_id, client) => {
  it("resolves its defaultTheme to a theme in scope", () => {
    expect(themeIdsInScope(client).has(client.defaultTheme)).toBe(true);
  });

  it("has a unique, titled page set", () => {
    const ids = client.pages.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const page of client.pages) expect(page.title.length).toBeGreaterThan(0);
  });

  it("every experiment has at least one variant", () => {
    for (const exp of client.experiments) expect(exp.variants.length).toBeGreaterThan(0);
  });

  it("every chosen variant exists", () => {
    for (const exp of client.experiments) {
      if (exp.chosen === undefined) continue;
      const variantIds = exp.variants.map((v) => v.id);
      expect(variantIds).toContain(exp.chosen);
    }
  });

  it("every experiment default theme resolves in scope", () => {
    const clientScope = themeIdsInScope(client);
    for (const exp of client.experiments) {
      if (exp.theme === undefined) continue;
      const expScope = new Set([...clientScope, ...exp.themes.map((t) => t.id)]);
      expect(expScope.has(exp.theme)).toBe(true);
    }
  });

  it("every experiment resolves to a page node (Main or a variant page)", () => {
    const mainPageIds = new Set(client.pages.map((p) => p.id));
    for (const exp of client.experiments) {
      const variantPages = exp.variants.flatMap((v) => v.pages);
      const variantPageIds = new Set(variantPages.map((p) => p.id));
      expect(mainPageIds.has(exp.page) || variantPageIds.has(exp.page)).toBe(true);
    }
  });

  it("never stacks two active experiments on one page (ADR-0012)", () => {
    const active = client.experiments.filter((e) => e.status === "active");
    const pages = active.map((e) => e.page);
    expect(new Set(pages).size).toBe(pages.length);
  });
});

describe("linkExperimentsToPages", () => {
  it("attaches an experiment to the Main page it explores, with no errors", () => {
    const home = makePage({ id: "home" });
    const exp = makeExperiment({
      id: "rebrand",
      page: "home",
      variants: [makeVariant({ id: "v1" })],
    });
    const errors: string[] = [];

    linkExperimentsToPages("acme", [home], [exp], errors);

    expect(errors).toEqual([]);
    expect(home.experiments).toEqual([exp]);
  });

  it("resolves a page that exists only in the experiment's variants", () => {
    const exp = makeExperiment({
      id: "onboarding",
      page: "welcome",
      variants: [makeVariant({ id: "v1", pages: [makePage({ id: "welcome" })] })],
    });
    const errors: string[] = [];

    linkExperimentsToPages("acme", [makePage({ id: "home" })], [exp], errors);

    expect(errors).toEqual([]);
  });

  it("errors when `page` matches no Main page and no variant page", () => {
    const exp = makeExperiment({
      id: "ghost",
      page: "nowhere",
      variants: [makeVariant({ id: "v1" })],
    });
    const errors: string[] = [];

    linkExperimentsToPages("acme", [makePage({ id: "home" })], [exp], errors);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('page "nowhere"');
  });

  it("errors when two active experiments share a lineage (ADR-0012)", () => {
    const home = makePage({ id: "home" });
    const a = makeExperiment({ id: "a-exp", page: "home", variants: [makeVariant({ id: "v1" })] });
    const b = makeExperiment({ id: "b-exp", page: "home", variants: [makeVariant({ id: "v1" })] });
    const errors: string[] = [];

    linkExperimentsToPages("acme", [home], [a, b], errors);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("at most one experiment per lineage");
    expect(home.experiments).toEqual([a, b]);
  });

  it("does not count decided/archived experiments against the lineage rule", () => {
    const home = makePage({ id: "home" });
    const decided = makeExperiment({
      id: "old",
      page: "home",
      status: "decided",
      variants: [makeVariant({ id: "v1" })],
    });
    const active = makeExperiment({
      id: "new",
      page: "home",
      variants: [makeVariant({ id: "v1" })],
    });
    const errors: string[] = [];

    linkExperimentsToPages("acme", [home], [decided, active], errors);

    expect(errors).toEqual([]);
  });
});
