import { beforeEach, describe, expect, it } from "vitest";
import { HELIX_HEADERS, call, db, seedSchema } from "./test-harness";

async function seedThread(
  id: string,
  client: string,
  route: string,
  status: string,
): Promise<void> {
  await db()
    .prepare(
      "INSERT INTO threads (id, client, route, theme_key, anchor_kind, anchor, status, created_by, created_at, viewport) VALUES (?, ?, ?, '', 'css', '.x', ?, 'seed', ?, '')",
    )
    .bind(id, client, route, status, `2026-01-01T00:00:0${id.slice(-1)}.000Z`)
    .run();
}

async function seedMessage(id: string, threadId: string, body: string): Promise<void> {
  await db()
    .prepare(
      "INSERT INTO messages (id, thread_id, author, body, created_at) VALUES (?, ?, 'seed', ?, '2026-01-01T00:00:00.000Z')",
    )
    .bind(id, threadId, body)
    .run();
}

beforeEach(async () => {
  await seedSchema();
  await seedThread("t1", "acme", "/home", "open");
  await seedThread("t2", "acme", "/about", "applied");
  await seedThread("t3", "globex", "/home", "open");
  await seedMessage("m1", "t1", "first");
  await seedMessage("m2", "t1", "second");
  await seedMessage("m3", "t3", "other client");
});

function ids(threads: unknown): string[] {
  return (threads as Array<{ id: string }>).map((t) => t.id);
}

describe("listThreads", () => {
  it("returns only the requested client's threads", async () => {
    const res = await call("/api/threads?client=acme", { headers: HELIX_HEADERS });
    expect(res.status).toBe(200);
    expect(ids(res.json.threads).toSorted()).toEqual(["t1", "t2"]);
  });

  it("nests each thread's messages and excludes other clients' messages", async () => {
    const res = await call("/api/threads?client=acme", { headers: HELIX_HEADERS });
    const threads = res.json.threads as Array<{ id: string; messages: Array<{ body: string }> }>;
    const t1 = threads.find((t) => t.id === "t1");
    expect(t1?.messages.map((m) => m.body)).toEqual(["first", "second"]);
    expect(threads.find((t) => t.id === "t2")?.messages).toEqual([]);
  });

  it("filters by status", async () => {
    const res = await call("/api/threads?client=acme&status=applied", { headers: HELIX_HEADERS });
    expect(ids(res.json.threads)).toEqual(["t2"]);
  });

  it("filters by route", async () => {
    const res = await call("/api/threads?client=acme&route=/home", { headers: HELIX_HEADERS });
    expect(ids(res.json.threads)).toEqual(["t1"]);
  });

  it("combines status and route filters", async () => {
    const res = await call("/api/threads?client=acme&status=open&route=/about", {
      headers: HELIX_HEADERS,
    });
    expect(ids(res.json.threads)).toEqual([]);
  });
});
