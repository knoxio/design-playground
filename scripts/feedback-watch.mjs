/**
 * Long-poll the feedback service for new activity on a client's threads and
 * exit when something appears — the event-driven half of the comment monitor
 * (mirrors `gh run watch`). Run it in the background; when it exits, the harness
 * re-invokes the session and /monitor-feedback applies + resolves the comment,
 * then re-arms with the new `since`. Reads the Access service token from .env
 * (same credentials as the dev proxy and the design-feedback MCP).
 *
 * Usage: node scripts/feedback-watch.mjs <client> [sinceISO]
 *   WATCH_INTERVAL_MS (default 5000) — poll cadence.
 *   WATCH_MAX_MS      (default 1800000) — exit (timeout) after this so the
 *                     watcher is re-armed rather than running forever.
 */
import { readFileSync } from "node:fs";

function loadDotenv() {
  const path = new URL("../.env", import.meta.url).pathname;
  const result = {};
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match) result[match[1]] = match[2].trim();
    }
  } catch {
    // no .env — handled below
  }
  return result;
}

function out(data) {
  process.stdout.write(`${JSON.stringify(data)}\n`);
}

const env = loadDotenv();
const base = (env.DP_FEEDBACK_URL ?? "https://design-playground.pages.dev/api").replace(/\/$/, "");
const client = process.argv[2];
const since = process.argv[3] ?? new Date().toISOString();
const interval = Number(process.env.WATCH_INTERVAL_MS ?? 5000);
const maxMs = Number(process.env.WATCH_MAX_MS ?? 1_800_000);

if (!client) {
  out({ error: "usage: node scripts/feedback-watch.mjs <client> [sinceISO]" });
  process.exit(2);
}
if (!env.CF_ACCESS_CLIENT_ID || !env.CF_ACCESS_CLIENT_SECRET) {
  out({ error: "No service token — copy .env.example to .env and fill it in" });
  process.exit(1);
}

const headers = {
  "CF-Access-Client-Id": env.CF_ACCESS_CLIENT_ID,
  "CF-Access-Client-Secret": env.CF_ACCESS_CLIENT_SECRET,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function latestStamp(threads, fallback) {
  let max = fallback;
  for (const t of threads) {
    if (t.created_at > max) max = t.created_at;
    for (const m of t.messages ?? []) if (m.created_at > max) max = m.created_at;
  }
  return max;
}

async function poll() {
  const url = `${base}/threads?client=${encodeURIComponent(client)}&status=open&since=${encodeURIComponent(since)}`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return { error: `${res.status}: ${(await res.text()).slice(0, 200)}` };
    const data = await res.json();
    return { threads: Array.isArray(data.threads) ? data.threads : [] };
  } catch (e) {
    return { error: String(e) };
  }
}

const startedAt = Date.now();
while (Date.now() - startedAt < maxMs) {
  const r = await poll();
  if (r.error) {
    out({ error: r.error });
    process.exit(1);
  }
  if (r.threads.length > 0) {
    out({
      changed: true,
      client,
      since,
      latest: latestStamp(r.threads, since),
      count: r.threads.length,
      threads: r.threads,
    });
    process.exit(0);
  }
  await sleep(interval);
}

out({ changed: false, timedOut: true, client, since });
process.exit(0);
