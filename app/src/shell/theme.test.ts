import { describe, expect, it } from "vitest";
import { makeClient, makeExperiment, makeTheme, makeVariant } from "../test/factories";
import { HELIX_STANDARD_THEME } from "../registry/types";
import { resolveTheme } from "./theme";

/**
 * `resolveTheme` picks the active theme by precedence
 * (valid override > experiment base > client default > Helix standard) and
 * exposes the in-scope options. Fixtures use distinctive theme ids so the
 * real global themes (appended last) never collide with the assertions.
 */

const clientWithDefault = () =>
  makeClient({
    id: "acme",
    defaultTheme: "brandA",
    themes: [makeTheme("brandA", "client")],
  });

describe("resolveTheme", () => {
  it("uses the client defaultTheme with no experiment or override", () => {
    const { currentThemeKey } = resolveTheme({ client: clientWithDefault(), isGallery: false });
    expect(currentThemeKey).toBe("client:brandA");
  });

  it("falls back to the Helix standard theme when the default resolves to nothing", () => {
    const client = makeClient({ id: "acme", defaultTheme: "ghost", themes: [] });
    const { currentThemeKey } = resolveTheme({ client, isGallery: false });
    expect(currentThemeKey).toBe(HELIX_STANDARD_THEME);
  });

  it("prefers an experiment's base theme over the client default when viewing it", () => {
    const client = makeClient({
      id: "acme",
      defaultTheme: "brandA",
      themes: [makeTheme("brandA", "client")],
      experiments: [
        makeExperiment({
          id: "rebrand",
          theme: "electric",
          themes: [makeTheme("electric", "experiment")],
          variants: [makeVariant({ id: "v1" })],
        }),
      ],
    });
    const { currentThemeKey } = resolveTheme({
      client,
      experimentId: "rebrand",
      isGallery: false,
    });
    expect(currentThemeKey).toBe("experiment:electric");
  });

  it("lets a valid override win over experiment and default", () => {
    const client = clientWithDefault();
    const { currentThemeKey } = resolveTheme({
      client,
      isGallery: false,
      overrideKey: "client:brandA",
    });
    expect(currentThemeKey).toBe("client:brandA");
  });

  it("ignores an override that is not an available option", () => {
    const { currentThemeKey } = resolveTheme({
      client: clientWithDefault(),
      isGallery: false,
      overrideKey: "client:bogus",
    });
    expect(currentThemeKey).toBe("client:brandA");
  });

  it("includes variant themes in scope when viewing a variant, client themes before global", () => {
    const client = makeClient({
      id: "acme",
      defaultTheme: "brandA",
      themes: [makeTheme("brandA", "client")],
      experiments: [
        makeExperiment({
          id: "rebrand",
          themes: [makeTheme("electric", "experiment")],
          variants: [makeVariant({ id: "v1", themes: [makeTheme("neon", "variant")] })],
        }),
      ],
    });
    const { themeOptions } = resolveTheme({
      client,
      experimentId: "rebrand",
      variantId: "v1",
      isGallery: false,
    });
    const ids = themeOptions.map((t) => t.id);
    expect(ids).toContain("electric");
    expect(ids).toContain("neon");
    expect(ids.indexOf("brandA")).toBeLessThan(themeOptions.findIndex((t) => t.scope === "global"));
  });

  it("exposes every active experiment's themes in gallery mode", () => {
    const client = makeClient({
      id: "acme",
      defaultTheme: "brandA",
      themes: [makeTheme("brandA", "client")],
      experiments: [
        makeExperiment({
          id: "rebrand",
          themes: [makeTheme("electric", "experiment")],
          variants: [makeVariant({ id: "v1", themes: [makeTheme("neon", "variant")] })],
        }),
        makeExperiment({
          id: "archived-one",
          status: "archived",
          themes: [makeTheme("dusty", "experiment")],
          variants: [makeVariant({ id: "v1" })],
        }),
      ],
    });
    const ids = resolveTheme({ client, isGallery: true }).themeOptions.map((t) => t.id);
    expect(ids).toContain("electric");
    expect(ids).toContain("neon");
    expect(ids).not.toContain("dusty");
  });
});
