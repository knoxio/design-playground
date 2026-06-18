export type ThreadMessage = {
  id: string;
  author: string;
  body: string;
  created_at: string;
};

export type ThreadStatus = "open" | "applied" | "rejected" | "outdated";

export type Thread = {
  id: string;
  client: string;
  route: string;
  theme_key: string;
  anchor_kind: "source" | "token" | "kit" | "selector" | "page";
  anchor: string;
  status: ThreadStatus;
  created_by: string;
  created_at: string;
  viewport: string;
  messages: ThreadMessage[];
};

export type Anchor =
  | { kind: "source"; source: string; tag: string; text: string }
  | { kind: "token"; token: string; text: string }
  | { kind: "kit"; component: string; text: string }
  | { kind: "selector"; selector: string; text: string }
  | { kind: "page" };

export const THREAD_STATUSES: ThreadStatus[] = ["open", "applied", "rejected", "outdated"];

const AUTHOR_KEY = "hx-comment-name";

/**
 * Comment authorship: Access surfaces use the validated email server-side;
 * where there is none (the local dev proxy), a once-asked display name from
 * localStorage rides along instead.
 */
export function storedAuthor(): string | null {
  return localStorage.getItem(AUTHOR_KEY);
}

export function rememberAuthor(name: string): void {
  localStorage.setItem(AUTHOR_KEY, name);
}

/** Whether the service sees a real identity for this surface (vs. the service token). */
export async function fetchIdentity(): Promise<string | null> {
  try {
    const res = await fetch("/api/me");
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const email = (data as Record<string, unknown>).email;
    return typeof email === "string" ? email : null;
  } catch {
    return null;
  }
}

export function parseAnchor(thread: Thread): Anchor | null {
  try {
    const data: unknown = JSON.parse(thread.anchor);
    if (typeof data !== "object" || data === null) return null;
    return { ...(data as object), kind: thread.anchor_kind } as Anchor;
  } catch {
    return null;
  }
}

export function anchorLabel(anchor: Anchor | null): string {
  switch (anchor?.kind) {
    case "source":
      return anchor.source;
    case "token":
      return `token ${anchor.token}`;
    case "kit":
      return `kit ${anchor.component}`;
    case "selector":
      return `"${anchor.text}"`;
    default:
      return "whole page";
  }
}

export async function fetchThreads(clientId: string): Promise<Thread[] | null> {
  try {
    const res = await fetch(`/api/threads?client=${encodeURIComponent(clientId)}`);
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (typeof data !== "object" || data === null) return null;
    const threads = (data as Record<string, unknown>).threads;
    return Array.isArray(threads) ? (threads as Thread[]) : null;
  } catch {
    return null;
  }
}

export async function createThread(args: {
  clientId: string;
  route: string;
  themeKey: string;
  anchor: Anchor;
  body: string;
}): Promise<boolean> {
  const { kind, ...rest } = args.anchor;
  const res = await fetch(`/api/threads?client=${encodeURIComponent(args.clientId)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      route: args.route,
      themeKey: args.themeKey,
      anchorKind: kind,
      anchor: JSON.stringify(rest),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      body: args.body,
      author: storedAuthor() ?? undefined,
    }),
  }).catch(() => null);
  return res?.ok ?? false;
}

export async function replyToThread(
  clientId: string,
  threadId: string,
  body: string,
): Promise<boolean> {
  const res = await fetch(
    `/api/threads/${threadId}/messages?client=${encodeURIComponent(clientId)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body, author: storedAuthor() ?? undefined }),
    },
  ).catch(() => null);
  return res?.ok ?? false;
}

export async function setThreadStatus(
  clientId: string,
  threadId: string,
  status: ThreadStatus,
): Promise<boolean> {
  const res = await fetch(`/api/threads/${threadId}?client=${encodeURIComponent(clientId)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
  }).catch(() => null);
  return res?.ok ?? false;
}

function describeAnchor(thread: Thread): string {
  const anchor = parseAnchor(thread);
  if (anchor?.kind === "source") return `${anchor.source} — <${anchor.tag}> "${anchor.text}"`;
  if (anchor?.kind === "token") return `token ${anchor.token} — "${anchor.text}"`;
  if (anchor?.kind === "kit") return `kit component ${anchor.component} — "${anchor.text}"`;
  if (anchor?.kind === "selector") return `${anchor.selector} — "${anchor.text}"`;
  return "whole page";
}

/**
 * The session export: comment threads serialized for a Claude session.
 * Same data the MCP server exposes — this is the clipboard path. Thread
 * ids are included so resolutions can be written back precisely.
 */
export function buildPayload(threads: Thread[]): string {
  const lines = ["[playground-feedback v3]"];
  const clientIds = [...new Set(threads.map((t) => t.client))];
  let n = 0;
  for (const clientId of clientIds) {
    lines.push("", `client: ${clientId}`);
    for (const t of threads.filter((thread) => thread.client === clientId)) {
      n += 1;
      lines.push(
        `${n}. [thread ${t.id}] ${describeAnchor(t)} (route ${t.route}, theme ${t.theme_key}, viewport ${t.viewport}, status ${t.status})`,
      );
      for (const m of t.messages) lines.push(`   ${m.author}: ${m.body}`);
    }
  }
  return lines.join("\n");
}
