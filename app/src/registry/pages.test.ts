import { describe, expect, it } from "vitest";
import { collectPages, type CollectPagesArgs } from "./pages";

/**
 * The files-or-folders page model (ADR-0010): a `.tsx` file is a leaf page, a
 * folder of step files is a flow, a flow is one level deep, and a page id may
 * not be both a file and a folder. Tests drive the pure collector with
 * synthetic glob modules so the rules are pinned without real fixtures.
 */

type Mod = Record<string, Record<string, unknown>>;

const leaf = (title: string, order?: number): Record<string, unknown> => ({
  default: () => null,
  meta: order === undefined ? { title } : { title, order },
});

function run(over: Partial<CollectPagesArgs>): {
  pages: ReturnType<typeof collectPages>;
  errors: string[];
} {
  const errors: string[] = over.errors ?? [];
  const pages = collectPages({
    leafModules: {},
    flowModules: {},
    deepModules: {},
    prefix: "acme/pages/",
    errors,
    ...over,
  });
  return { pages, errors };
}

describe("collectPages", () => {
  it("discovers a single .tsx as a leaf page", () => {
    const leafModules: Mod = { "../../clients/acme/pages/dashboard.tsx": leaf("Dashboard") };
    const { pages, errors } = run({ leafModules });
    expect(errors).toEqual([]);
    expect(pages).toHaveLength(1);
    expect(pages[0]?.id).toBe("dashboard");
    expect(pages[0]?.component).toBeTypeOf("function");
    expect(pages[0]?.steps).toBeUndefined();
  });

  it("discovers a folder as a flow with ordered steps", () => {
    const flowModules: Mod = {
      "../../clients/acme/pages/request-quote/freight.tsx": leaf("Freight", 2),
      "../../clients/acme/pages/request-quote/lane.tsx": leaf("Lane", 1),
    };
    const { pages, errors } = run({ flowModules });
    expect(errors).toEqual([]);
    expect(pages).toHaveLength(1);
    const flow = pages[0];
    expect(flow?.id).toBe("request-quote");
    expect(flow?.component).toBeUndefined();
    expect(flow?.steps?.map((s) => s.id)).toEqual(["lane", "freight"]);
  });

  it("orders steps by meta.order then filename", () => {
    const flowModules: Mod = {
      "../../clients/acme/pages/onboarding/zeta.tsx": leaf("Zeta", 1),
      "../../clients/acme/pages/onboarding/alpha.tsx": leaf("Alpha", 1),
      "../../clients/acme/pages/onboarding/beta.tsx": leaf("Beta", 0),
    };
    const { pages } = run({ flowModules });
    expect(pages[0]?.steps?.map((s) => s.id)).toEqual(["beta", "alpha", "zeta"]);
  });

  it("rejects a step nested more than one level deep (ADR-0010)", () => {
    const deepModules: Mod = {
      "../../clients/acme/pages/flow/sub/step.tsx": leaf("Too deep"),
    };
    const { errors } = run({ deepModules });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("one level deep");
  });

  it("rejects a page id that is both a file and a flow folder", () => {
    const leafModules: Mod = { "../../clients/acme/pages/quote.tsx": leaf("Quote") };
    const flowModules: Mod = { "../../clients/acme/pages/quote/step.tsx": leaf("Step") };
    const { errors } = run({ leafModules, flowModules });
    expect(errors.some((e) => e.includes("both a file and a flow folder"))).toBe(true);
  });

  it("reads a valid colocated `states` export (ADR-0011)", () => {
    const leafModules: Mod = {
      "../../clients/acme/pages/dash.tsx": {
        default: () => null,
        meta: { title: "Dash" },
        states: { empty: () => null, error: () => null },
      },
    };
    const { pages, errors } = run({ leafModules });
    expect(errors).toEqual([]);
    expect(Object.keys(pages[0]?.states ?? {})).toEqual(["empty", "error"]);
  });

  it("degrades a malformed `states` export to a contract error, not a crash", () => {
    const leafModules: Mod = {
      "../../clients/acme/pages/dash.tsx": {
        default: () => null,
        meta: { title: "Dash" },
        states: { empty: "not a function" },
      },
    };
    const { pages, errors } = run({ leafModules });
    expect(errors.some((e) => e.includes("invalid `states`"))).toBe(true);
    expect(pages[0]?.component).toBeTypeOf("function");
    expect(pages[0]?.states).toBeUndefined();
  });
});
