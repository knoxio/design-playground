import { X } from "@design/ui/icons";
import { useState } from "react";
import { useNavigate } from "react-router";
import { CopyButton } from "../../components/CopyButton";
import { glass } from "../glass";
import { NameField } from "./NameField";
import {
  anchorLabel,
  buildPayload,
  parseAnchor,
  replyToThread,
  setThreadStatus,
  THREAD_STATUSES,
  type Thread,
  type ThreadStatus,
} from "./api";

const statusTone: Record<ThreadStatus, string> = {
  open: "bg-primary text-primary-foreground",
  applied: "bg-accent text-accent-foreground",
  rejected: "bg-muted text-muted-foreground",
  outdated: "bg-muted text-muted-foreground",
};

function ThreadCard({
  thread,
  internal,
  needsName,
  offRoute,
  onNamed,
  onChanged,
  onGoTo,
}: {
  thread: Thread;
  internal: boolean;
  needsName: boolean;
  offRoute: boolean;
  onNamed: (name: string) => void;
  onChanged: () => void;
  onGoTo: (route: string) => void;
}) {
  const [reply, setReply] = useState("");
  const [name, setName] = useState("");
  const ready = reply.trim() !== "" && (!needsName || name.trim() !== "");
  const send = () => {
    if (needsName) onNamed(name.trim());
    void replyToThread(thread.client, thread.id, reply.trim()).then(() => {
      setReply("");
      onChanged();
    });
  };
  return (
    <div className="mb-2 rounded-md border border-border/60 bg-surface/60 p-2">
      <div className="flex items-center justify-between gap-2">
        {offRoute ? (
          <button
            type="button"
            onClick={() => onGoTo(thread.route)}
            title={`Go to ${thread.route}`}
            className="truncate font-mono text-[10px] text-primary hover:underline"
          >
            ↗ {anchorLabel(parseAnchor(thread))}
          </button>
        ) : (
          <p
            className="truncate font-mono text-[10px] text-muted-foreground"
            title={`${thread.route} · ${thread.created_by}`}
          >
            {anchorLabel(parseAnchor(thread))}
          </p>
        )}
        {internal ? (
          <select
            value={thread.status}
            onChange={(e) => {
              void setThreadStatus(thread.client, thread.id, e.target.value as ThreadStatus).then(
                onChanged,
              );
            }}
            className="rounded-md border border-border bg-surface px-1 py-0.5 text-[10px]"
          >
            {THREAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusTone[thread.status]}`}
          >
            {thread.status}
          </span>
        )}
      </div>
      {thread.messages.map((m) => (
        <p key={m.id} className="mt-1 text-xs">
          <span className="text-muted-foreground">{m.author.split("@")[0]}: </span>
          {m.body}
        </p>
      ))}
      {needsName && reply.trim() !== "" ? <NameField value={name} onChange={setName} /> : null}
      <div className="mt-2 flex gap-1">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Reply…"
          className="min-w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
        <button
          type="button"
          disabled={!ready}
          onClick={send}
          className="rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

/**
 * The comment panel: every thread for the client, current page first.
 * Internally it also carries moderation and the session export — "Copy for
 * Claude" serializes stored threads, the same data the MCP server exposes.
 */
export function CommentsPanel({
  threads,
  route,
  internal,
  needsName,
  onNamed,
  onCommentPage,
  onChanged,
  onClose,
}: {
  threads: Thread[];
  route: string;
  internal: boolean;
  needsName: boolean;
  onNamed: (name: string) => void;
  onCommentPage: () => void;
  onChanged: () => void;
  onClose: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  const onPage = threads.filter((t) => t.route === route);
  const shown = showAll ? threads : onPage;
  const openThreads = threads.filter((t) => t.status === "open");

  return (
    <div
      data-dp-ui
      className={`fixed top-16 right-4 z-50 flex max-h-[70vh] w-80 flex-col rounded-xl ${glass}`}
    >
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <p className="text-sm font-medium">
          Comments <span className="text-muted-foreground">· {shown.length}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showAll ? "This page" : `All (${threads.length})`}
          </button>
          <button
            type="button"
            aria-label="Close comments"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {shown.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">
            Click any element to comment on it, or comment on the whole page below.
          </p>
        ) : (
          shown.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              internal={internal}
              needsName={needsName}
              offRoute={thread.route !== route}
              onNamed={onNamed}
              onChanged={onChanged}
              onGoTo={(to) => void navigate(to)}
            />
          ))
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2">
        <button
          type="button"
          onClick={onCommentPage}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Comment on page
        </button>
        {internal ? (
          <CopyButton
            text={buildPayload(showAll ? openThreads : onPage.filter((t) => t.status === "open"))}
            label="Copy for Claude"
          />
        ) : null}
      </div>
    </div>
  );
}
