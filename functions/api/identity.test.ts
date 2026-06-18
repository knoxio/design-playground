import { beforeEach, describe, expect, it } from "vitest";
import { CLIENT_HEADERS, TEAM_HEADERS, SERVICE_HEADERS, call, seedSchema } from "./test-harness";

beforeEach(seedSchema);

const guarded = "/api/threads?client=acme";

describe("identify — no identity", () => {
  it("403s a guarded route with neither email nor jwt", async () => {
    const res = await call(guarded);
    expect(res.status).toBe(403);
    expect(String(res.json.error)).toContain("no identity");
  });

  it("403s a write with no identity", async () => {
    const res = await call("/api/threads?client=acme", {
      method: "POST",
      body: { route: "/r", anchorKind: "css", anchor: ".x", body: "hi" },
    });
    expect(res.status).toBe(403);
  });
});

describe("identify — team domain user", () => {
  it("authenticates a default-domain email and can moderate", async () => {
    const create = await call("/api/threads?client=acme", {
      method: "POST",
      headers: TEAM_HEADERS,
      body: { route: "/r", anchorKind: "css", anchor: ".x", body: "hi" },
    });
    expect(create.status).toBe(201);
    const id = String(create.json.id);
    const status = await call(`/api/threads/${id}?client=acme`, {
      method: "PATCH",
      headers: TEAM_HEADERS,
      body: { status: "applied" },
    });
    expect(status.status).toBe(200);
  });

  it("honors a configurable team domain via DP_TEAM_DOMAIN", async () => {
    const headers = { "cf-access-authenticated-user-email": "lead@design.example" };
    const create = await call("/api/threads?client=acme", {
      method: "POST",
      headers,
      designDomain: "design.example",
      body: { route: "/r", anchorKind: "css", anchor: ".x", body: "hi" },
    });
    const id = String(create.json.id);
    const status = await call(`/api/threads/${id}?client=acme`, {
      method: "PATCH",
      headers,
      designDomain: "design.example",
      body: { status: "applied" },
    });
    expect(status.status).toBe(200);
  });
});

describe("identify — service token", () => {
  it("treats an email-less jwt request as a moderator", async () => {
    const create = await call("/api/threads?client=acme", {
      method: "POST",
      headers: SERVICE_HEADERS,
      body: { route: "/r", anchorKind: "css", anchor: ".x", body: "hi" },
    });
    expect(create.status).toBe(201);
    const id = String(create.json.id);
    const status = await call(`/api/threads/${id}?client=acme`, {
      method: "PATCH",
      headers: SERVICE_HEADERS,
      body: { status: "rejected" },
    });
    expect(status.status).toBe(200);
  });

  it("reports a null email on /api/me for a service token", async () => {
    const res = await call("/api/me", { headers: SERVICE_HEADERS });
    expect(res.status).toBe(200);
    expect(res.json.email).toBeNull();
  });
});

describe("identify — non-design client email", () => {
  it("authenticates but cannot moderate", async () => {
    const create = await call("/api/threads?client=acme", {
      method: "POST",
      headers: CLIENT_HEADERS,
      body: { route: "/r", anchorKind: "css", anchor: ".x", body: "hi" },
    });
    expect(create.status).toBe(201);
    const id = String(create.json.id);
    const status = await call(`/api/threads/${id}?client=acme`, {
      method: "PATCH",
      headers: CLIENT_HEADERS,
      body: { status: "applied" },
    });
    expect(status.status).toBe(403);
    expect(String(status.json.error)).toContain("Design-only");
  });
});
