import { describe, expect, it } from "vitest";
import {
  FULL,
  fromFrameRoute,
  frameSize,
  rotated,
  toFrameRoute,
  type Viewport,
  viewportLabel,
} from "./viewport";

describe("viewportLabel", () => {
  it("labels full, fixed, and ratio viewports", () => {
    expect(viewportLabel(FULL)).toBe("Full");
    expect(viewportLabel({ kind: "fixed", label: "Phone", w: 390, h: 844 })).toBe("Phone 390×844");
    expect(viewportLabel({ kind: "ratio", label: "16:9", rw: 16, rh: 9 })).toBe("16:9");
  });
});

describe("rotated", () => {
  it("swaps fixed dimensions", () => {
    expect(rotated({ kind: "fixed", label: "Phone", w: 390, h: 844 })).toEqual({
      kind: "fixed",
      label: "Phone",
      w: 844,
      h: 390,
    });
  });

  it("swaps ratio sides", () => {
    expect(rotated({ kind: "ratio", label: "16:9", rw: 16, rh: 9 })).toEqual({
      kind: "ratio",
      label: "16:9",
      rw: 9,
      rh: 16,
    });
  });

  it("leaves full unchanged and is its own inverse", () => {
    expect(rotated(FULL)).toEqual(FULL);
    const phone: Viewport = { kind: "fixed", label: "Phone", w: 390, h: 844 };
    expect(rotated(rotated(phone))).toEqual(phone);
  });
});

describe("frameSize", () => {
  it("passes fixed sizes through unchanged", () => {
    expect(
      frameSize({ kind: "fixed", label: "Phone", w: 390, h: 844 }, { w: 1000, h: 1000 }),
    ).toEqual({ w: 390, h: 844 });
  });

  it("scales a ratio to fit the available area, constrained by the tighter axis", () => {
    expect(frameSize({ kind: "ratio", label: "16:9", rw: 16, rh: 9 }, { w: 1600, h: 900 })).toEqual(
      {
        w: 1600,
        h: 900,
      },
    );
    expect(frameSize({ kind: "ratio", label: "1:1", rw: 1, rh: 1 }, { w: 1000, h: 600 })).toEqual({
      w: 600,
      h: 600,
    });
  });
});

describe("frame route encoding", () => {
  it("prefixes and theme-encodes a route", () => {
    expect(toFrameRoute("/c/marlow/p/home", "g:design")).toBe(
      "/frame/c/marlow/p/home?theme=g%3Adesign",
    );
  });

  it("strips the prefix and passes through non-frame routes", () => {
    expect(fromFrameRoute("/frame/c/marlow/p/home")).toBe("/c/marlow/p/home");
    expect(fromFrameRoute("/c/marlow/p/home")).toBe("/c/marlow/p/home");
  });
});
