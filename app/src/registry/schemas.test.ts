import { describe, expect, it } from "vitest";
import { makeTokenSet } from "../test/factories";
import { clientYamlSchema, experimentYamlSchema, pageMetaSchema, themeSchema } from "./schemas";

/**
 * The Zod schemas are the field-level half of the client-folder contract:
 * what a `client.yaml`, `experiment.yaml`, page `meta`, or theme YAML must
 * contain to be accepted by discovery. These tests pin every rule with a
 * passing and a failing case so a loosened schema can't slip through.
 */

describe("clientYamlSchema", () => {
  it("accepts a minimal valid client", () => {
    expect(clientYamlSchema.safeParse({ name: "Acme", defaultTheme: "default" }).success).toBe(
      true,
    );
  });

  it("requires a non-empty name", () => {
    expect(clientYamlSchema.safeParse({ defaultTheme: "default" }).success).toBe(false);
    expect(clientYamlSchema.safeParse({ name: "", defaultTheme: "default" }).success).toBe(false);
  });

  it("requires a non-empty defaultTheme", () => {
    expect(clientYamlSchema.safeParse({ name: "Acme" }).success).toBe(false);
    expect(clientYamlSchema.safeParse({ name: "Acme", defaultTheme: "" }).success).toBe(false);
  });

  it("validates preview email addresses", () => {
    const base = { name: "Acme", defaultTheme: "default" };
    expect(clientYamlSchema.safeParse({ ...base, preview: { emails: ["a@b.com"] } }).success).toBe(
      true,
    );
    expect(
      clientYamlSchema.safeParse({ ...base, preview: { emails: ["not-an-email"] } }).success,
    ).toBe(false);
  });

  it("validates preview domain format", () => {
    const base = { name: "Acme", defaultTheme: "default" };
    expect(
      clientYamlSchema.safeParse({ ...base, preview: { domains: ["acme.com"] } }).success,
    ).toBe(true);
    expect(clientYamlSchema.safeParse({ ...base, preview: { domains: ["nodot"] } }).success).toBe(
      false,
    );
  });

  it("rejects a non-boolean preview.public", () => {
    expect(
      clientYamlSchema.safeParse({
        name: "Acme",
        defaultTheme: "default",
        preview: { public: "yes" },
      }).success,
    ).toBe(false);
  });
});

describe("experimentYamlSchema", () => {
  it("accepts a minimal active experiment", () => {
    expect(
      experimentYamlSchema.safeParse({ name: "Quote flow", status: "active", page: "new-quote" })
        .success,
    ).toBe(true);
  });

  it("requires a non-empty name", () => {
    expect(experimentYamlSchema.safeParse({ status: "active", page: "p" }).success).toBe(false);
    expect(experimentYamlSchema.safeParse({ name: "", status: "active", page: "p" }).success).toBe(
      false,
    );
  });

  it("requires a non-empty page — every experiment belongs to a page", () => {
    expect(experimentYamlSchema.safeParse({ name: "X", status: "active" }).success).toBe(false);
    expect(experimentYamlSchema.safeParse({ name: "X", status: "active", page: "" }).success).toBe(
      false,
    );
    expect(experimentYamlSchema.safeParse({ name: "X", status: "active", page: 7 }).success).toBe(
      false,
    );
  });

  it("accepts only the three lifecycle statuses", () => {
    for (const status of ["active", "decided", "archived"]) {
      expect(experimentYamlSchema.safeParse({ name: "X", status, page: "p" }).success).toBe(true);
    }
    expect(experimentYamlSchema.safeParse({ name: "X", status: "paused", page: "p" }).success).toBe(
      false,
    );
    expect(experimentYamlSchema.safeParse({ name: "X", page: "p" }).success).toBe(false);
  });

  it("accepts a variants label map and decision fields", () => {
    expect(
      experimentYamlSchema.safeParse({
        name: "Quote flow",
        status: "decided",
        page: "new-quote",
        variants: { wizard: "Guided wizard", form: "Dense form" },
        chosen: "wizard",
        rationale: "MD preferred the guided path",
      }).success,
    ).toBe(true);
  });
});

describe("pageMetaSchema", () => {
  it("accepts a title with optional order", () => {
    expect(pageMetaSchema.safeParse({ title: "Dashboard" }).success).toBe(true);
    expect(pageMetaSchema.safeParse({ title: "Dashboard", order: 1 }).success).toBe(true);
  });

  it("requires a non-empty title", () => {
    expect(pageMetaSchema.safeParse({}).success).toBe(false);
    expect(pageMetaSchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("rejects a non-numeric order", () => {
    expect(pageMetaSchema.safeParse({ title: "Dashboard", order: "first" }).success).toBe(false);
  });
});

describe("themeSchema", () => {
  it("accepts a complete token set", () => {
    expect(themeSchema.safeParse(makeTokenSet()).success).toBe(true);
  });

  it("rejects a theme missing a required color", () => {
    const theme = makeTokenSet();
    const { primary: _omitted, ...colors } = theme.colors;
    expect(themeSchema.safeParse({ ...theme, colors }).success).toBe(false);
  });

  it("rejects an unknown density", () => {
    expect(themeSchema.safeParse({ ...makeTokenSet(), density: "airy" }).success).toBe(false);
  });

  it("rejects an unknown number style", () => {
    const theme = makeTokenSet();
    expect(
      themeSchema.safeParse({ ...theme, type: { ...theme.type, numbers: "old-style" } }).success,
    ).toBe(false);
  });

  it("rejects a type scale missing a step", () => {
    const theme = makeTokenSet();
    const { "3xl": _omitted, ...scale } = theme.type.scale;
    expect(themeSchema.safeParse({ ...theme, type: { ...theme.type, scale } }).success).toBe(false);
  });

  it("rejects missing radii", () => {
    const theme = makeTokenSet();
    const { radii: _omitted, ...rest } = theme;
    expect(themeSchema.safeParse(rest).success).toBe(false);
  });
});
