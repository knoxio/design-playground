import { env, reset } from "cloudflare:test";
import { onRequest } from "./[[path]]";

export interface FeedbackEnv {
  HX_DB: D1Database;
  HX_CLIENT?: string;
  HX_HELIX_DOMAIN?: string;
}

type Ctx = EventContext<FeedbackEnv, string, Record<string, unknown>>;

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS threads (
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
    resolved_at TEXT,
    viewport TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    author TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS idx_threads_client ON threads (client, status)",
  "CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages (thread_id)",
];

/**
 * The handler's top-level `schemaReady` flag survives across tests in the
 * isolate, but isolated storage wipes D1 between tests — so `ensureSchema`
 * no-ops on a fresh empty DB. Tests seed the schema themselves to compensate.
 */
export async function seedSchema(): Promise<void> {
  await reset();
  for (const statement of SCHEMA_STATEMENTS) {
    await db().exec(statement.replace(/\s+/g, " ").trim());
  }
}

export function db(): D1Database {
  return env.HX_DB;
}

export interface CallOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  client?: string;
  helixDomain?: string;
}

function buildContext(url: string, options: CallOptions): Ctx {
  const init: RequestInit<IncomingRequestCfProperties<unknown>> = {
    method: options.method ?? "GET",
    headers: options.headers,
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
    init.headers = { ...options.headers, "content-type": "application/json" };
  }
  const request = new Request<unknown, IncomingRequestCfProperties<unknown>>(url, init);
  const callEnv: FeedbackEnv & { ASSETS: { fetch: typeof fetch } } = {
    HX_DB: env.HX_DB,
    HX_CLIENT: options.client,
    HX_HELIX_DOMAIN: options.helixDomain,
    ASSETS: { fetch },
  };
  return {
    request,
    env: callEnv,
    params: {},
    data: {},
    functionPath: new URL(url).pathname,
    waitUntil: () => undefined,
    passThroughOnException: () => undefined,
    next: () => Promise.resolve(new Response(null, { status: 404 })),
  };
}

export async function call(
  path: string,
  options: CallOptions = {},
): Promise<{ status: number; json: Record<string, unknown> }> {
  const response = await onRequest(buildContext(`https://surface.test${path}`, options));
  const text = await response.text();
  const parsed: unknown = text.length > 0 ? JSON.parse(text) : {};
  const json =
    typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
  return { status: response.status, json };
}

export const HELIX_HEADERS: Record<string, string> = {
  "cf-access-authenticated-user-email": "mary@helixcollective.com",
};

export const CLIENT_HEADERS: Record<string, string> = {
  "cf-access-authenticated-user-email": "buyer@acme-corp.com",
};

export const SERVICE_HEADERS: Record<string, string> = {
  "cf-access-jwt-assertion": "service.token.jwt",
};
