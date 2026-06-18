import { describe, expect, it } from "vitest";
import { buildAddress, parseAddress, preserveCoordinates, type Address } from "./address";

/**
 * The canonical address (ADR-0013) has one form per surface. These tests pin
 * build↔parse round-trips for every coordinate combination and the best-effort
 * preservation rule, so routing, navigation, and comment anchoring stay in sync.
 */

const cases: Address[] = [
  { clientId: "marlow", pageId: "home" },
  { clientId: "marlow", pageId: "quotes", state: "empty" },
  { clientId: "marlow", experimentId: "quote-flow", variantId: "juniper", pageId: "new-quote" },
  {
    clientId: "marlow",
    experimentId: "quote-flow",
    variantId: "banksia",
    pageId: "new-quote",
    stepId: "schedule",
  },
  {
    clientId: "marlow",
    experimentId: "quote-flow",
    variantId: "banksia",
    pageId: "new-quote",
    stepId: "schedule",
    state: "empty",
  },
];

describe("buildAddress / parseAddress", () => {
  it.each(cases)("round-trips %o", (address) => {
    const url = buildAddress(address);
    const [pathname, search] = url.split("?");
    const parsed = parseAddress(pathname ?? "", search ? `?${search}` : "");
    expect(parsed).toEqual(address);
  });

  it("builds the documented shapes", () => {
    expect(buildAddress({ clientId: "marlow", pageId: "home" })).toBe("/c/marlow/p/home");
    expect(
      buildAddress({
        clientId: "marlow",
        experimentId: "quote-flow",
        variantId: "banksia",
        pageId: "new-quote",
        stepId: "schedule",
        state: "empty",
      }),
    ).toBe("/c/marlow/x/quote-flow/banksia/p/new-quote/schedule?state=empty");
  });

  it("carries an anchor in the fragment", () => {
    const address: Address = { clientId: "marlow", pageId: "home", anchor: "submit" };
    expect(buildAddress(address)).toBe("/c/marlow/p/home#submit");
    expect(parseAddress("/c/marlow/p/home", "", "#submit")).toEqual(address);
  });

  it("returns null for a non-address path", () => {
    expect(parseAddress("/")).toBeNull();
    expect(parseAddress("/c/marlow/tokens")).toBeNull();
    expect(parseAddress("/c/marlow/components")).toBeNull();
  });
});

const at = (over: Partial<Address>): Address => ({ clientId: "marlow", pageId: "p", ...over });

describe("preserveCoordinates", () => {
  it("drops the step when the target page is a leaf", () => {
    const result = preserveCoordinates(at({ stepId: "schedule" }), {
      steps: [],
      statesFor: () => [],
    });
    expect(result.stepId).toBeUndefined();
  });

  it("keeps a step the target flow has", () => {
    const result = preserveCoordinates(at({ stepId: "freight" }), {
      steps: ["lane", "freight", "review"],
      statesFor: () => [],
    });
    expect(result.stepId).toBe("freight");
  });

  it("falls back to the first step when the target lacks the step", () => {
    const result = preserveCoordinates(at({ stepId: "nope" }), {
      steps: ["lane", "freight"],
      statesFor: () => [],
    });
    expect(result.stepId).toBe("lane");
  });

  it("keeps a state the target surface has, else drops it", () => {
    const kept = preserveCoordinates(at({ state: "empty" }), {
      steps: [],
      statesFor: () => ["empty", "error"],
    });
    expect(kept.state).toBe("empty");

    const dropped = preserveCoordinates(at({ state: "empty" }), {
      steps: [],
      statesFor: () => ["error"],
    });
    expect(dropped.state).toBeUndefined();
  });
});
