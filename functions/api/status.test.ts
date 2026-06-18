import { beforeEach, describe, expect, it } from "vitest";
import { CLIENT_HEADERS, HELIX_HEADERS, call, db, seedSchema } from "./test-harness";

const valid = { route: "/home", anchorKind: "css", anchor: ".hero", body: "fix" };

async function makeThread(client: string): Promise<string> {
  const res = await call(`/api/threads?client=${client}`, {
    method: "POST",
    headers: HELIX_HEADERS,
    body: valid,
  });
  return String(res.json.id);
}

async function row(id: string): Promise<{ status: string; resolved_at: string | null } | null> {
  return db()
    .prepare("SELECT status, resolved_at FROM threads WHERE id = ?")
    .bind(id)
    .first<{ status: string; resolved_at: string | null }>();
}

beforeEach(seedSchema);

describe("setStatus — authorization", () => {
  it("403s a non-moderator client user", async () => {
    const id = await makeThread("acme");
    const res = await call(`/api/threads/${id}?client=acme`, {
      method: "PATCH",
      headers: CLIENT_HEADERS,
      body: { status: "applied" },
    });
    expect(res.status).toBe(403);
  });
});

describe("setStatus — validation", () => {
  it("400s a missing status", async () => {
    const id = await makeThread("acme");
    const res = await call(`/api/threads/${id}?client=acme`, {
      method: "PATCH",
      headers: HELIX_HEADERS,
      body: {},
    });
    expect(res.status).toBe(400);
  });

  it("400s an unknown status", async () => {
    const id = await makeThread("acme");
    const res = await call(`/api/threads/${id}?client=acme`, {
      method: "PATCH",
      headers: HELIX_HEADERS,
      body: { status: "wontfix" },
    });
    expect(res.status).toBe(400);
  });

  it.each(["open", "applied", "rejected", "outdated"])("accepts %s", async (status) => {
    const id = await makeThread("acme");
    const res = await call(`/api/threads/${id}?client=acme`, {
      method: "PATCH",
      headers: HELIX_HEADERS,
      body: { status },
    });
    expect(res.status).toBe(200);
  });
});

describe("setStatus — resolved_at semantics", () => {
  it("stamps resolved_at for a non-open status", async () => {
    const id = await makeThread("acme");
    await call(`/api/threads/${id}?client=acme`, {
      method: "PATCH",
      headers: HELIX_HEADERS,
      body: { status: "applied" },
    });
    const after = await row(id);
    expect(after?.status).toBe("applied");
    expect(after?.resolved_at).not.toBeNull();
  });

  it("clears resolved_at back to null when reopened", async () => {
    const id = await makeThread("acme");
    await call(`/api/threads/${id}?client=acme`, {
      method: "PATCH",
      headers: HELIX_HEADERS,
      body: { status: "applied" },
    });
    await call(`/api/threads/${id}?client=acme`, {
      method: "PATCH",
      headers: HELIX_HEADERS,
      body: { status: "open" },
    });
    expect((await row(id))?.resolved_at).toBeNull();
  });
});

describe("setStatus — missing thread", () => {
  it("404s a non-existent thread", async () => {
    const res = await call("/api/threads/ghost?client=acme", {
      method: "PATCH",
      headers: HELIX_HEADERS,
      body: { status: "applied" },
    });
    expect(res.status).toBe(404);
  });
});
