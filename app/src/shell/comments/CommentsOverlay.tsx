import { useCallback, useEffect, useMemo, useState } from "react";
import { glass } from "../glass";
import { findTarget, resolveThread, type Target } from "./anchors";
import {
  anchorLabel,
  createThread,
  fetchIdentity,
  fetchThreads,
  rememberAuthor,
  storedAuthor,
  type Anchor,
  type Thread,
  type ThreadStatus,
} from "./api";
import { NameField } from "./NameField";
import { CommentsPanel } from "./Panel";

type Draft = { anchor: Anchor; x: number; y: number };

const dotTone: Record<ThreadStatus, string> = {
  open: "bg-primary text-primary-foreground",
  applied: "bg-accent text-accent-foreground",
  rejected: "bg-muted text-muted-foreground",
  outdated: "bg-muted text-muted-foreground",
};

function useCaptureListeners(
  active: boolean,
  paused: boolean,
  callbacks: {
    onHover: (t: Target | null) => void;
    onPick: (d: Draft) => void;
    onExit: () => void;
  },
) {
  useEffect(() => {
    if (!active) return;
    const onMove = (e: MouseEvent) => {
      if (paused) return;
      callbacks.onHover(findTarget(e.clientX, e.clientY));
    };
    const onClick = (e: MouseEvent) => {
      if (paused) return;
      const target = findTarget(e.clientX, e.clientY);
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      callbacks.onPick({ anchor: target.anchor, x: e.clientX, y: e.clientY });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !paused) callbacks.onExit();
    };
    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [active, paused, callbacks]);
}

function useRepaintOnScroll(active: boolean) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const bump = () => setTick((t) => t + 1);
    window.addEventListener("scroll", bump, true);
    window.addEventListener("resize", bump);
    return () => {
      window.removeEventListener("scroll", bump, true);
      window.removeEventListener("resize", bump);
    };
  }, [active]);
}

function NoteBox({
  draft,
  needsName,
  onNamed,
  onSubmit,
  onCancel,
}: {
  draft: Draft;
  needsName: boolean;
  onNamed: (name: string) => void;
  onSubmit: (note: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const ready = note.trim() !== "" && (!needsName || name.trim() !== "");
  const submit = () => {
    if (needsName) onNamed(name.trim());
    onSubmit(note.trim());
  };
  const left = Math.min(draft.x, window.innerWidth - 340);
  const top = Math.min(draft.y + 8, window.innerHeight - 180);
  return (
    <div data-dp-ui className={`fixed z-[60] w-80 rounded-xl p-3 ${glass}`} style={{ left, top }}>
      <p className="mb-2 truncate font-mono text-xs text-muted-foreground">
        {anchorLabel(draft.anchor)}
      </p>
      {needsName ? <NameField value={name} onChange={setName} /> : null}
      <textarea
        ref={(el) => el?.focus()}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && ready) submit();
        }}
        placeholder="What should change here?"
        className="mb-2 h-20 w-full resize-none rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={submit}
          className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          Comment
        </button>
      </div>
    </div>
  );
}

/**
 * The one commenting system, Figma-style: target an element (or the whole
 * page), write the note, reply in threads — same overlay for the internal
 * app and client previews; the service is the single store. Capture only
 * runs while active, but threads stay loaded so the dock badge is honest.
 */
export function CommentsOverlay({
  active,
  clientId,
  themeKey,
  route,
  internal,
  onOpenCount,
  onExit,
}: {
  active: boolean;
  clientId: string;
  themeKey: string;
  route: string;
  internal: boolean;
  onOpenCount: (count: number) => void;
  onExit: () => void;
}) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [available, setAvailable] = useState(false);
  const [hover, setHover] = useState<Target | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [needsName, setNeedsName] = useState(false);

  useEffect(() => {
    void fetchIdentity().then((email) => {
      setNeedsName(email === null && storedAuthor() === null);
    });
  }, []);
  const onNamed = useCallback((name: string) => {
    rememberAuthor(name);
    setNeedsName(false);
  }, []);

  const refresh = useCallback(() => {
    void fetchThreads(clientId).then((result) => {
      setAvailable(result !== null);
      if (result) {
        setThreads(result);
        onOpenCount(result.filter((t) => t.status === "open").length);
      }
    });
  }, [clientId, onOpenCount]);

  useEffect(refresh, [refresh]);

  const callbacks = useMemo(() => ({ onHover: setHover, onPick: setDraft, onExit }), [onExit]);
  useCaptureListeners(active && available, draft !== null, callbacks);
  useRepaintOnScroll(active);
  useEffect(() => {
    if (!active) {
      setHover(null);
      setDraft(null);
    }
  }, [active]);

  if (!active) return null;
  if (!available) {
    return (
      <p
        data-dp-ui
        className={`fixed top-16 right-4 z-50 w-80 rounded-xl p-3 text-xs text-muted-foreground ${glass}`}
      >
        Comments are unavailable here — the feedback service isn't reachable (internal: check
        `.env`; previews need Access).
      </p>
    );
  }

  const hoverRect = hover && !draft ? hover.el.getBoundingClientRect() : null;
  const dots = threads
    .filter((t) => t.route === route)
    .flatMap((thread) => {
      const el = resolveThread(thread);
      if (!el) return [];
      const r = el.getBoundingClientRect();
      return [{ thread, x: r.right - 10, y: r.top - 10 }];
    });

  return (
    <>
      {hoverRect ? (
        <div
          data-dp-ui
          className="pointer-events-none fixed z-40 rounded-sm border-2 border-primary/80"
          style={{
            left: hoverRect.left - 2,
            top: hoverRect.top - 2,
            width: hoverRect.width + 4,
            height: hoverRect.height + 4,
          }}
        >
          <span className="absolute -top-5 left-0 rounded-sm bg-primary px-1 font-mono text-[10px] whitespace-nowrap text-primary-foreground">
            {hover ? anchorLabel(hover.anchor) : null}
          </span>
        </div>
      ) : null}
      {dots.map(({ thread, x, y }) => (
        <span
          key={thread.id}
          data-dp-ui
          title={thread.messages[0]?.body}
          className={`fixed z-40 flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-bold shadow-md ${dotTone[thread.status]}`}
          style={{ left: x, top: y }}
        >
          {thread.messages.length}
        </span>
      ))}
      {draft ? (
        <NoteBox
          draft={draft}
          needsName={needsName}
          onNamed={onNamed}
          onCancel={() => setDraft(null)}
          onSubmit={(note) => {
            void createThread({
              clientId,
              route,
              themeKey,
              anchor: draft.anchor,
              body: note,
            }).then((ok) => {
              if (ok) {
                setDraft(null);
                refresh();
              }
            });
          }}
        />
      ) : null}
      <CommentsPanel
        threads={threads}
        route={route}
        internal={internal}
        needsName={needsName}
        onNamed={onNamed}
        onChanged={refresh}
        onClose={onExit}
        onCommentPage={() =>
          setDraft({ anchor: { kind: "page" }, x: window.innerWidth - 360, y: 60 })
        }
      />
    </>
  );
}
