import { describe, expect, it } from "vitest";
import { anchorLabel, buildPayload, parseAnchor, type Thread } from "./api";

function makeThread(overrides: Partial<Thread> & { id: string }): Thread {
  return {
    client: "acme",
    route: "/c/acme/p/home",
    theme_key: "client:brandA",
    anchor_kind: "page",
    anchor: "{}",
    status: "open",
    created_by: "mary@example.com",
    created_at: "2026-06-13T00:00:00Z",
    viewport: "1440x900",
    messages: [],
    ...overrides,
  };
}

describe("parseAnchor", () => {
  it("reattaches the kind to a stored source anchor", () => {
    const thread = makeThread({
      id: "t1",
      anchor_kind: "source",
      anchor: JSON.stringify({ source: "Dashboard.tsx:10", tag: "button", text: "Request quote" }),
    });
    expect(parseAnchor(thread)).toEqual({
      kind: "source",
      source: "Dashboard.tsx:10",
      tag: "button",
      text: "Request quote",
    });
  });

  it("returns null on malformed anchor JSON", () => {
    expect(parseAnchor(makeThread({ id: "t1", anchor: "{not json" }))).toBeNull();
  });

  it("returns null when the anchor is not an object", () => {
    expect(parseAnchor(makeThread({ id: "t1", anchor: "42" }))).toBeNull();
  });
});

describe("anchorLabel", () => {
  it("describes each anchor kind", () => {
    expect(anchorLabel({ kind: "source", source: "X.tsx:1", tag: "div", text: "hi" })).toBe(
      "X.tsx:1",
    );
    expect(anchorLabel({ kind: "token", token: "primary", text: "" })).toBe("token primary");
    expect(anchorLabel({ kind: "kit", component: "Button", text: "" })).toBe("kit Button");
    expect(anchorLabel({ kind: "selector", selector: "div > p", text: "Hello" })).toBe('"Hello"');
    expect(anchorLabel({ kind: "page" })).toBe("whole page");
    expect(anchorLabel(null)).toBe("whole page");
  });
});

describe("buildPayload", () => {
  it("groups threads by client, numbers them, and nests messages", () => {
    const threads: Thread[] = [
      makeThread({
        id: "t1",
        client: "acme",
        anchor_kind: "token",
        anchor: JSON.stringify({ token: "primary", text: "too bright" }),
        messages: [{ id: "m1", author: "mary", body: "soften this", created_at: "x" }],
      }),
      makeThread({ id: "t2", client: "acme" }),
      makeThread({ id: "t3", client: "globex" }),
    ];
    const payload = buildPayload(threads);
    expect(payload.startsWith("[playground-feedback v3]")).toBe(true);
    expect(payload).toContain("client: acme");
    expect(payload).toContain("client: globex");
    expect(payload).toContain("1. [thread t1] token primary");
    expect(payload).toContain("   mary: soften this");
    expect(payload).toContain("2. [thread t2] whole page");
    // numbering is global across clients, so globex's thread is #3
    expect(payload).toContain("3. [thread t3] whole page");
  });

  it("produces just the header for no threads", () => {
    expect(buildPayload([])).toBe("[playground-feedback v3]");
  });
});
