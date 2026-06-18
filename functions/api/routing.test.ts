import { beforeEach, describe, expect, it } from "vitest";
import { TEAM_HEADERS, call, seedSchema } from "./test-harness";

beforeEach(seedSchema);

describe("routing — health", () => {
  it("returns ok without any auth, before identify runs", async () => {
    const res = await call("/api/health");
    expect(res.status).toBe(200);
    expect(res.json).toEqual({ ok: true });
  });

  it("returns ok even when a jwt or email is absent", async () => {
    const res = await call("/api/health", { method: "POST" });
    expect(res.status).toBe(200);
    expect(res.json.ok).toBe(true);
  });
});

describe("routing — me", () => {
  it("echoes the authenticated email", async () => {
    const res = await call("/api/me", { headers: TEAM_HEADERS });
    expect(res.status).toBe(200);
    expect(res.json.email).toBe("mary@example.com");
  });

  it("requires identity", async () => {
    const res = await call("/api/me");
    expect(res.status).toBe(403);
  });
});

describe("routing — client resolution", () => {
  it("400s when neither DP_CLIENT nor ?client= is present", async () => {
    const res = await call("/api/threads", { headers: TEAM_HEADERS });
    expect(res.status).toBe(400);
    expect(String(res.json.error)).toContain("client");
  });

  it("uses the DP_CLIENT env binding when set", async () => {
    const res = await call("/api/threads", { headers: TEAM_HEADERS, client: "acme" });
    expect(res.status).toBe(200);
    expect(res.json.threads).toEqual([]);
  });
});

describe("routing — unknown segments", () => {
  it("404s an unknown top-level segment", async () => {
    const res = await call("/api/widgets?client=acme", { headers: TEAM_HEADERS });
    expect(res.status).toBe(404);
  });

  it("404s an unsupported method/shape under threads", async () => {
    const res = await call("/api/threads/some-id?client=acme", {
      method: "DELETE",
      headers: TEAM_HEADERS,
    });
    expect(res.status).toBe(404);
  });
});
