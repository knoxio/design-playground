/**
 * MCP server over the feedback comment service — lets a Claude session
 * read, reply to, and resolve comment threads as structured tools instead
 * of curl. Registered in .mcp.json; authenticates with the Access service
 * token from the repo-root .env (same credentials as the dev proxy). The
 * overlay's "Copy for Claude" payload is the offline equivalent.
 */
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

function loadDotenv() {
  const path = new URL("../.env", import.meta.url).pathname;
  const env = {};
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match) env[match[1]] = match[2].trim();
    }
  } catch {
    // no .env — every tool call will explain what's missing
  }
  return env;
}

const env = loadDotenv();
const base = (env.HX_FEEDBACK_URL ?? "https://hx-playground.pages.dev/api").replace(/\/$/, "");

async function api(path, init = {}) {
  if (!env.CF_ACCESS_CLIENT_ID || !env.CF_ACCESS_CLIENT_SECRET) {
    return { error: "No service token — copy .env.example to .env and fill it in" };
  }
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "CF-Access-Client-Id": env.CF_ACCESS_CLIENT_ID,
      "CF-Access-Client-Secret": env.CF_ACCESS_CLIENT_SECRET,
      "content-type": "application/json",
      ...init.headers,
    },
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: `${res.status}: ${text.slice(0, 200)}` };
  }
}

function asResult(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

const server = new McpServer({ name: "hx-feedback", version: "1.0.0" });

server.registerTool(
  "list_threads",
  {
    description:
      "List feedback comment threads for a client, with their messages. " +
      "Optionally filter by status (open/applied/rejected/outdated) or route.",
    inputSchema: {
      client: z.string().describe("Client id, e.g. marlow"),
      status: z.enum(["open", "applied", "rejected", "outdated"]).optional(),
      route: z.string().optional().describe("Filter to one route, e.g. /c/marlow/p/home"),
    },
  },
  async ({ client, status, route }) => {
    const params = new URLSearchParams({ client });
    if (status) params.set("status", status);
    if (route) params.set("route", route);
    return asResult(await api(`/threads?${params}`));
  },
);

server.registerTool(
  "reply_to_thread",
  {
    description:
      "Reply to a feedback thread. The client sees the reply on their preview — " +
      "use it to explain what was applied, or why something was rejected.",
    inputSchema: {
      client: z.string(),
      thread_id: z.string(),
      body: z.string(),
    },
  },
  async ({ client, thread_id, body }) =>
    asResult(
      await api(`/threads/${thread_id}/messages?client=${encodeURIComponent(client)}`, {
        method: "POST",
        body: JSON.stringify({ body, author: "Claude" }),
      }),
    ),
);

server.registerTool(
  "set_thread_status",
  {
    description:
      "Set a feedback thread's status: applied (change made), rejected (with a reply " +
      "explaining why), outdated (anchor no longer matches), or open (reopen).",
    inputSchema: {
      client: z.string(),
      thread_id: z.string(),
      status: z.enum(["open", "applied", "rejected", "outdated"]),
    },
  },
  async ({ client, thread_id, status }) =>
    asResult(
      await api(`/threads/${thread_id}?client=${encodeURIComponent(client)}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    ),
);

await server.connect(new StdioServerTransport());
