import { ChevronUp, GripVertical, Minus, X } from "@design/ui/icons";
import { type PointerEvent, useRef, useState } from "react";
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
  const sending = useRef(false);
  const ready = reply.trim() !== "" && (!needsName || name.trim() !== "");
  const send = () => {
    if (!ready || sending.current) return; // guard against double-submit
    sending.current = true;
    if (needsName) onNamed(name.trim());
    void replyToThread(thread.client, thread.id, reply.trim()).then(() => {
      sending.current = false;
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

/** The scrollable thread list plus the footer (comment-on-page + Copy). Split
 *  out of CommentsPanel so the panel shell stays simple. */
function PanelBody({
  shown,
  route,
  internal,
  needsName,
  onNamed,
  onChanged,
  onCommentPage,
  showAll,
  openThreads,
  onPage,
}: {
  shown: Thread[];
  route: string;
  internal: boolean;
  needsName: boolean;
  onNamed: (name: string) => void;
  onChanged: () => void;
  onCommentPage: () => void;
  showAll: boolean;
  openThreads: Thread[];
  onPage: Thread[];
}) {
  const navigate = useNavigate();
  return (
    <>
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
    </>
  );
}

/** Drag-to-move for the panel: returns an explicit position once dragged, and
 *  pointer handlers for the drag handle (the title bar). */
function usePanelDrag() {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const panel = e.currentTarget.closest("[data-dp-ui]");
    if (!(panel instanceof HTMLElement)) return;
    const r = panel.getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setPos({
      left: Math.max(4, Math.min(e.clientX - drag.current.dx, window.innerWidth - 80)),
      top: Math.max(4, Math.min(e.clientY - drag.current.dy, window.innerHeight - 48)),
    });
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  };
  return {
    pos,
    handleProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}

/**
 * The comment panel: every thread for the client, current page first.
 * Internally it also carries moderation and the session export — "Copy for
 * Claude" serializes stored threads, the same data the MCP server exposes.
 * Draggable by its title bar and minimizable, so it can be moved out of the way
 * to pin comments on content behind it.
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
  const [showResolved, setShowResolved] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const { pos, handleProps } = usePanelDrag();
  const onPage = threads.filter((t) => t.route === route);
  const scoped = showAll ? threads : onPage;
  const shown = showResolved ? scoped : scoped.filter((t) => t.status === "open");
  const resolvedCount = scoped.length - scoped.filter((t) => t.status === "open").length;
  const openThreads = threads.filter((t) => t.status === "open");

  return (
    <div
      data-dp-ui
      style={pos ? { top: pos.top, left: pos.left } : undefined}
      className={`fixed z-50 flex max-h-[70vh] w-80 flex-col rounded-xl ${pos ? "" : "top-16 right-4"} ${glass}`}
    >
      <div className="flex items-center justify-between gap-1 border-b border-border/60 py-2 pr-1.5 pl-1.5">
        <div
          {...handleProps}
          title="Drag to move"
          className="flex flex-1 cursor-move touch-none items-center gap-1.5 px-1"
        >
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
          <p className="text-sm font-medium">
            Comments <span className="text-muted-foreground">· {shown.length}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {minimized ? null : (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {showAll ? "This page" : `All (${threads.length})`}
            </button>
          )}
          {!minimized && resolvedCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowResolved((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {showResolved ? "Hide resolved" : `Resolved (${resolvedCount})`}
            </button>
          ) : null}
          <button
            type="button"
            aria-label={minimized ? "Expand comments" : "Minimize comments"}
            onClick={() => setMinimized((v) => !v)}
            className="text-muted-foreground hover:text-foreground"
          >
            {minimized ? <ChevronUp className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
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
      {minimized ? null : (
        <PanelBody
          shown={shown}
          route={route}
          internal={internal}
          needsName={needsName}
          onNamed={onNamed}
          onChanged={onChanged}
          onCommentPage={onCommentPage}
          showAll={showAll}
          openThreads={openThreads}
          onPage={onPage}
        />
      )}
    </div>
  );
}
