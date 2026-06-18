/**
 * The feedback thread API (PRD-05 slice 2), deployed as Pages Functions
 * inside every surface. Auth is the surface's own Cloudflare Access app:
 * requests arrive with the validated user email in a header, or with a
 * service-token JWT (Mary's Claude session). Previews are hard-scoped to
 * their own client by the DP_CLIENT env var; the internal surface passes
 * ?client=. Public previews (no Access, so no JWT) get a 403 — there are
 * no anonymous writes, and no anonymous reads either.
 */

interface Env {
  DP_DB: D1Database;
  DP_CLIENT?: string;
  DP_TEAM_DOMAIN?: string;
}

type Identity = { email: string | null; canModerate: boolean };

const SCHEMA = `
CREATE TABLE IF NOT EXISTS threads (
  id TEXT PRIMARY KEY,
  client TEXT NOT NULL,
  route TEXT NOT NULL,
  theme_key TEXT NOT NULL DEFAULT '',
  anchor_kind TEXT NOT NULL,
  anchor TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  resolved_by TEXT,
  resolved_at TEXT
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_threads_client ON threads (client, status);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages (thread_id);
`;

const STATUSES = ["open", "applied", "rejected", "outdated"];
let schemaReady = false;

async function ensureSchema(db: D1Database): Promise<void> {
  if (schemaReady) return;
  await db.exec(SCHEMA.trim().replace(/\n/g, " "));
  try {
    await db.exec("ALTER TABLE threads ADD COLUMN viewport TEXT NOT NULL DEFAULT ''");
  } catch {
    // column already exists
  }
  schemaReady = true;
}

function identify(request: Request, env: Env): Identity | null {
  const email = request.headers.get("cf-access-authenticated-user-email");
  const hasJwt = request.headers.get("cf-access-jwt-assertion") !== null;
  if (!hasJwt && email === null) return null;
  const domain = env.DP_TEAM_DOMAIN ?? "example.com";
  const isDesign = email !== null && email.toLowerCase().endsWith(`@${domain}`);
  const isService = email === null;
  return { email, canModerate: isDesign || isService };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const data: unknown = await request.json();
    return typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Access-authenticated users are always their email — a self-declared name
 * is honored only on service-token requests (the local dev proxy and
 * session automation), where there is no identity to spoof.
 */
function authorName(who: Identity, body: Record<string, unknown>): string {
  return who.email ?? str(body.author)?.slice(0, 60) ?? "service";
}

async function listThreads(env: Env, client: string, url: URL): Promise<Response> {
  const status = url.searchParams.get("status");
  const route = url.searchParams.get("route");
  let query = "SELECT * FROM threads WHERE client = ?";
  const params: string[] = [client];
  if (status !== null) {
    query += " AND status = ?";
    params.push(status);
  }
  if (route !== null) {
    query += " AND route = ?";
    params.push(route);
  }
  query += " ORDER BY created_at";
  const threads = await env.DP_DB.prepare(query)
    .bind(...params)
    .all();
  const messages = await env.DP_DB.prepare(
    "SELECT m.* FROM messages m JOIN threads t ON t.id = m.thread_id WHERE t.client = ? ORDER BY m.created_at",
  )
    .bind(client)
    .all();
  const byThread = new Map<string, unknown[]>();
  for (const m of messages.results) {
    const key = String(m.thread_id);
    byThread.set(key, [...(byThread.get(key) ?? []), m]);
  }
  return json({
    threads: threads.results.map((t) => ({ ...t, messages: byThread.get(String(t.id)) ?? [] })),
  });
}

async function createThread(
  env: Env,
  client: string,
  who: Identity,
  body: Record<string, unknown>,
): Promise<Response> {
  const route = str(body.route);
  const anchorKind = str(body.anchorKind);
  const anchor = str(body.anchor);
  const text = str(body.body);
  if (!route || !anchorKind || !anchor || !text) {
    return json({ error: "route, anchorKind, anchor, body are required" }, 400);
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const author = authorName(who, body);
  await env.DP_DB.batch([
    env.DP_DB.prepare(
      "INSERT INTO threads (id, client, route, theme_key, anchor_kind, anchor, status, created_by, created_at, viewport) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)",
    ).bind(
      id,
      client,
      route,
      str(body.themeKey) ?? "",
      anchorKind,
      anchor,
      author,
      now,
      str(body.viewport) ?? "",
    ),
    env.DP_DB.prepare(
      "INSERT INTO messages (id, thread_id, author, body, created_at) VALUES (?, ?, ?, ?, ?)",
    ).bind(crypto.randomUUID(), id, author, text, now),
  ]);
  return json({ id }, 201);
}

async function addMessage(
  env: Env,
  client: string,
  threadId: string,
  who: Identity,
  body: Record<string, unknown>,
): Promise<Response> {
  const text = str(body.body);
  if (!text) return json({ error: "body is required" }, 400);
  const thread = await env.DP_DB.prepare("SELECT id FROM threads WHERE id = ? AND client = ?")
    .bind(threadId, client)
    .first();
  if (!thread) return json({ error: "thread not found" }, 404);
  await env.DP_DB.prepare(
    "INSERT INTO messages (id, thread_id, author, body, created_at) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(crypto.randomUUID(), threadId, authorName(who, body), text, new Date().toISOString())
    .run();
  return json({ ok: true }, 201);
}

async function setStatus(
  env: Env,
  client: string,
  threadId: string,
  who: Identity,
  body: Record<string, unknown>,
): Promise<Response> {
  if (!who.canModerate) return json({ error: "status changes are Design-only" }, 403);
  const status = str(body.status);
  if (status === null || !STATUSES.includes(status)) {
    return json({ error: `status must be one of ${STATUSES.join(", ")}` }, 400);
  }
  const result = await env.DP_DB.prepare(
    "UPDATE threads SET status = ?, resolved_by = ?, resolved_at = ? WHERE id = ? AND client = ?",
  )
    .bind(
      status,
      who.email ?? "service",
      status === "open" ? null : new Date().toISOString(),
      threadId,
      client,
    )
    .run();
  if (result.meta.changes === 0) return json({ error: "thread not found" }, 404);
  return json({ ok: true });
}

async function dispatchThreads(ctx: {
  request: Request;
  env: Env;
  who: Identity;
  client: string;
  url: URL;
  segments: string[];
}): Promise<Response> {
  const { request, env, who, client, url, segments } = ctx;
  const threadId = segments[1];
  if (request.method === "GET" && threadId === undefined) return listThreads(env, client, url);
  if (request.method === "POST" && threadId === undefined) {
    return createThread(env, client, who, await readBody(request));
  }
  if (request.method === "POST" && threadId !== undefined && segments[2] === "messages") {
    return addMessage(env, client, threadId, who, await readBody(request));
  }
  if (request.method === "PATCH" && threadId !== undefined && segments[2] === undefined) {
    return setStatus(env, client, threadId, who, await readBody(request));
  }
  return json({ error: "not found" }, 404);
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const segments = url.pathname
    .replace(/^\/api\/?/, "")
    .split("/")
    .filter(Boolean);

  if (segments[0] === "health") return json({ ok: true });

  const who = identify(request, env);
  if (who === null) return json({ error: "no identity — is this surface behind Access?" }, 403);

  if (segments[0] === "me") return json({ email: who.email });

  const client = env.DP_CLIENT ?? url.searchParams.get("client");
  if (client === null) return json({ error: "client query parameter is required" }, 400);

  await ensureSchema(env.DP_DB);

  if (segments[0] !== "threads") return json({ error: "not found" }, 404);
  return dispatchThreads({ request, env, who, client, url, segments });
};
