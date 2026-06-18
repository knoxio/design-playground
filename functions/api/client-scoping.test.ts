import { beforeEach, describe, expect, it } from "vitest";
import { TEAM_HEADERS, call, seedSchema } from "./test-harness";

const valid = { route: "/home", anchorKind: "css", anchor: ".hero", body: "scoped" };

let clientBThreadId = "";

beforeEach(async () => {
  await seedSchema();
  const res = await call("/api/threads?client=clientB", {
    method: "POST",
    headers: TEAM_HEADERS,
    body: valid,
  });
  clientBThreadId = String(res.json.id);
});

describe("client isolation", () => {
  it("client A cannot read client B's threads", async () => {
    const res = await call("/api/threads?client=clientA", { headers: TEAM_HEADERS });
    expect(res.json.threads).toEqual([]);
  });

  it("client A cannot message client B's thread (404)", async () => {
    const res = await call(`/api/threads/${clientBThreadId}/messages?client=clientA`, {
      method: "POST",
      headers: TEAM_HEADERS,
      body: { body: "intrusion" },
    });
    expect(res.status).toBe(404);
  });

  it("client A cannot change status on client B's thread (404)", async () => {
    const res = await call(`/api/threads/${clientBThreadId}?client=clientA`, {
      method: "PATCH",
      headers: TEAM_HEADERS,
      body: { status: "applied" },
    });
    expect(res.status).toBe(404);
  });

  it("client B can operate on its own thread", async () => {
    const res = await call(`/api/threads/${clientBThreadId}?client=clientB`, {
      method: "PATCH",
      headers: TEAM_HEADERS,
      body: { status: "applied" },
    });
    expect(res.status).toBe(200);
  });
});
