// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { kitManifest } from "@design/ui";
import { clients } from "../registry/clients";
import type { ClientEntry } from "../registry/types";

/**
 * Render smoke: every kit demo, every discovered client/variant page, and
 * every component demo must mount without throwing. This is the cheap net
 * that catches broken imports, bad mock-data shapes, and null derefs the
 * moment a page or component is added — no per-page test authoring needed.
 * It asserts "it renders", not how it looks (visual checks are Tier D).
 */

type Case = { label: string; node: ReactNode };

/** A leaf renders its default plus every named state; a flow recurses into steps. */
function casesForPage(label: string, page: ClientEntry["pages"][number]): Case[] {
  if (page.steps) {
    return page.steps.flatMap((step) => casesForPage(`${label}/${step.id}`, step));
  }
  const cases: Case[] = [];
  if (page.component) cases.push({ label, node: createElement(page.component) });
  for (const [name, thunk] of Object.entries(page.states ?? {})) {
    cases.push({ label: `${label}?state=${name}`, node: createElement(thunk) });
  }
  return cases;
}

function pageCasesFor(client: ClientEntry): Case[] {
  const cases: Case[] = client.pages.flatMap((page) =>
    casesForPage(`page:${client.id}/${page.id}`, page),
  );
  for (const exp of client.experiments) {
    for (const variant of exp.variants) {
      for (const page of variant.pages) {
        cases.push(...casesForPage(`page:${client.id}/${exp.id}/${variant.id}/${page.id}`, page));
      }
    }
  }
  return cases;
}

function componentCasesFor(client: ClientEntry): Case[] {
  const cases: Case[] = [];
  for (const c of client.components) {
    if (c.demo)
      cases.push({ label: `component:${client.id}/${c.id}`, node: createElement(c.demo) });
  }
  for (const exp of client.experiments) {
    for (const c of exp.components) {
      if (c.demo) {
        cases.push({
          label: `component:${client.id}/${exp.id}/${c.id}`,
          node: createElement(c.demo),
        });
      }
    }
  }
  return cases;
}

const kitCases: Case[] = kitManifest.map((entry) => ({
  label: `kit:${entry.id}`,
  node: entry.demo(),
}));
const pageCases: Case[] = clients.flatMap(pageCasesFor);
const componentCases: Case[] = clients.flatMap(componentCasesFor);
const allCases: Case[] = [...kitCases, ...pageCases, ...componentCases];

afterEach(cleanup);

describe("render smoke", () => {
  it("has cases to render", () => {
    expect(kitCases.length).toBeGreaterThan(0);
    expect(pageCases.length).toBeGreaterThan(0);
  });

  it.each(allCases)("renders $label without throwing", ({ node }) => {
    expect(() => render(createElement("div", null, node))).not.toThrow();
  });
});
