import { beforeEach, describe, expect, it } from "vitest";
import {
  CLIENT_HEADERS,
  HELIX_HEADERS,
  SERVICE_HEADERS,
  call,
  db,
  seedSchema,
} from "./test-harness";

beforeEach(seedSchema);

const valid = { route: "/home", anchorKind: "css", anchor: ".hero", body: "looks off" };

async function authorOfFirstMessage(threadId: string): Promise<string | undefined> {
  const row = await db()
    .prepare("SELECT author FROM messages WHERE thread_id = ? ORDER BY created_at LIMIT 1")
    .bind(threadId)
    .first<{ author: string }>();
  return row?.author;
}

describe("createThread — validation", () => {
  const required: Array<keyof typeof valid> = ["route", "anchorKind", "anchor", "body"];
  it.each(required)("400s when %s is missing", async (field) => {
    const body = { ...valid, [field]: undefined };
    const res = await call("/api/threads?client=acme", {
      method: "POST",
      headers: HELIX_HEADERS,
      body,
    });
    expect(res.status).toBe(400);
  });

  it("400s on an empty-string field", async () => {
    const res = await call("/api/threads?client=acme", {
      method: "POST",
      headers: HELIX_HEADERS,
      body: { ...valid, anchor: "" },
    });
    expect(res.status).toBe(400);
  });
});

describe("createThread — success", () => {
  it("returns 201 with an id and inserts a thread plus its first message", async () => {
    const res = await call("/api/threads?client=acme", {
      method: "POST",
      headers: HELIX_HEADERS,
      body: valid,
    });
    expect(res.status).toBe(201);
    const id = String(res.json.id);
    expect(id.length).toBeGreaterThan(0);
    const thread = await db().prepare("SELECT * FROM threads WHERE id = ?").bind(id).first();
    expect(thread?.client).toBe("acme");
    expect(thread?.status).toBe("open");
    const message = await db()
      .prepare("SELECT * FROM messages WHERE thread_id = ?")
      .bind(id)
      .first();
    expect(message?.body).toBe("looks off");
  });
});

describe("createThread — author resolution", () => {
  it("uses the Access email for an authenticated user, ignoring body.author", async () => {
    const res = await call("/api/threads?client=acme", {
      method: "POST",
      headers: CLIENT_HEADERS,
      body: { ...valid, author: "Imposter" },
    });
    expect(await authorOfFirstMessage(String(res.json.id))).toBe("buyer@acme-corp.com");
  });

  it("honors body.author for a service token, sliced to 60 chars", async () => {
    const longName = "x".repeat(80);
    const res = await call("/api/threads?client=acme", {
      method: "POST",
      headers: SERVICE_HEADERS,
      body: { ...valid, author: longName },
    });
    expect(await authorOfFirstMessage(String(res.json.id))).toBe("x".repeat(60));
  });

  it("falls back to 'service' for a service token with no body.author", async () => {
    const res = await call("/api/threads?client=acme", {
      method: "POST",
      headers: SERVICE_HEADERS,
      body: valid,
    });
    expect(await authorOfFirstMessage(String(res.json.id))).toBe("service");
  });
});

describe("addMessage", () => {
  async function makeThread(client: string): Promise<string> {
    const res = await call(`/api/threads?client=${client}`, {
      method: "POST",
      headers: HELIX_HEADERS,
      body: valid,
    });
    return String(res.json.id);
  }

  it("400s when body is missing", async () => {
    const id = await makeThread("acme");
    const res = await call(`/api/threads/${id}/messages?client=acme`, {
      method: "POST",
      headers: HELIX_HEADERS,
      body: {},
    });
    expect(res.status).toBe(400);
  });

  it("201s and appends a message", async () => {
    const id = await makeThread("acme");
    const res = await call(`/api/threads/${id}/messages?client=acme`, {
      method: "POST",
      headers: HELIX_HEADERS,
      body: { body: "a reply" },
    });
    expect(res.status).toBe(201);
    const count = await db()
      .prepare("SELECT COUNT(*) AS n FROM messages WHERE thread_id = ?")
      .bind(id)
      .first<{ n: number }>();
    expect(count?.n).toBe(2);
  });

  it("404s when the thread belongs to a different client", async () => {
    const id = await makeThread("globex");
    const res = await call(`/api/threads/${id}/messages?client=acme`, {
      method: "POST",
      headers: HELIX_HEADERS,
      body: { body: "cross-client" },
    });
    expect(res.status).toBe(404);
  });
});
