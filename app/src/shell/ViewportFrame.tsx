import { useEffect, useRef, useState } from "react";
import {
  frameSize,
  toFrameRoute,
  type FrameToShell,
  type ShellToFrame,
  type Viewport,
} from "./viewport";

type Avail = { w: number; h: number };

const HANDLES = [
  { corner: "nw", className: "-top-1.5 -left-1.5 cursor-nwse-resize" },
  { corner: "ne", className: "-top-1.5 -right-1.5 cursor-nesw-resize" },
  { corner: "sw", className: "-bottom-1.5 -left-1.5 cursor-nesw-resize" },
  { corner: "se", className: "-bottom-1.5 -right-1.5 cursor-nwse-resize" },
];

function useAvail(ref: React.RefObject<HTMLDivElement | null>): Avail | null {
  const [avail, setAvail] = useState<Avail | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () =>
      setAvail({ w: Math.max(el.clientWidth - 48, 200), h: Math.max(el.clientHeight - 64, 200) });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return avail;
}

/**
 * Hosts the prototype in a same-origin iframe at a simulated viewport size —
 * a real frame, so responsive utilities respond exactly as on the device.
 * Oversized frames scale to fit (true CSS pixels preserved); corner handles
 * resize live and hand the shell a Custom size. The frame is mounted once
 * per src and navigates internally; route changes flow up via postMessage.
 */
export function ViewportFrame({
  viewport,
  route,
  themeKey,
  commentsActive,
  onRouteChange,
  onOpenCount,
  onExitComments,
  onResize,
}: {
  viewport: Exclude<Viewport, { kind: "full" }>;
  route: string;
  themeKey: string;
  commentsActive: boolean;
  onRouteChange: (route: string) => void;
  onOpenCount: (count: number) => void;
  onExitComments: () => void;
  onResize: (w: number, h: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const frameRouteRef = useRef(route);
  const initialSrc = useRef(toFrameRoute(route, themeKey));
  const [dragging, setDragging] = useState(false);
  const avail = useAvail(containerRef);

  const postToFrame = (message: ShellToFrame) => {
    iframeRef.current?.contentWindow?.postMessage(message, window.location.origin);
  };

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      const data = e.data as FrameToShell;
      if (data.kind === "route") {
        frameRouteRef.current = data.route;
        onRouteChange(data.route);
      }
      if (data.kind === "open-count") onOpenCount(data.count);
      if (data.kind === "exit-comments") onExitComments();
      if (data.kind === "ready") postToFrame({ kind: "comments-active", active: commentsActive });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [commentsActive, onRouteChange, onOpenCount, onExitComments]);

  useEffect(() => {
    postToFrame({ kind: "comments-active", active: commentsActive });
  }, [commentsActive]);

  useEffect(() => {
    if (route !== frameRouteRef.current) {
      frameRouteRef.current = route;
      iframeRef.current?.contentWindow?.location.replace(toFrameRoute(route, themeKey));
    }
  }, [route, themeKey]);

  if (!avail) return <div ref={containerRef} className="h-full w-full" />;

  const size = frameSize(viewport, avail);
  const scale = Math.min(1, avail.w / size.w, avail.h / size.h);

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const onMove = (ev: PointerEvent) => {
      const w = Math.max(240, Math.round(Math.abs(ev.clientX - center.x) * 2) / scale);
      const h = Math.max(240, Math.round(Math.abs(ev.clientY - center.y) * 2) / scale);
      onResize(Math.round(w), Math.round(h));
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center overflow-hidden bg-muted/40"
    >
      <div className="relative" style={{ width: size.w * scale, height: size.h * scale }}>
        <div
          className="absolute top-0 left-0 origin-top-left overflow-hidden rounded-md bg-background shadow-lg outline outline-border"
          style={{ width: size.w, height: size.h, transform: `scale(${scale})` }}
        >
          {/* Unsandboxed by design: the frame is this same app at a
              simulated size, and needs same-origin for the comment API
              and postMessage route sync. */}
          <iframe
            ref={iframeRef}
            src={initialSrc.current}
            title="Prototype viewport"
            className="h-full w-full border-0"
            style={dragging ? { pointerEvents: "none" } : undefined}
          />
        </div>
        {HANDLES.map(({ corner, className }) => (
          <span
            key={corner}
            data-dp-ui
            onPointerDown={startDrag}
            className={`absolute z-10 h-3 w-3 rounded-full border border-border bg-background shadow-sm ${className}`}
          />
        ))}
        <span className="absolute -bottom-6 left-0 font-mono text-[10px] text-muted-foreground">
          {size.w}×{size.h}
          {scale < 1 ? ` · ${Math.round(scale * 100)}%` : ""}
        </span>
      </div>
    </div>
  );
}
