export type Viewport =
  | { kind: "full" }
  | { kind: "fixed"; label: string; w: number; h: number }
  | { kind: "ratio"; label: string; rw: number; rh: number };

export const FULL: Viewport = { kind: "full" };

export const VIEWPORT_PRESETS: Viewport[] = [
  FULL,
  { kind: "fixed", label: "Phone", w: 390, h: 844 },
  { kind: "fixed", label: "Tablet", w: 820, h: 1180 },
  { kind: "fixed", label: "Laptop", w: 1280, h: 800 },
  { kind: "ratio", label: "16:9", rw: 16, rh: 9 },
  { kind: "ratio", label: "4:3", rw: 4, rh: 3 },
  { kind: "ratio", label: "1:1", rw: 1, rh: 1 },
];

export function viewportLabel(viewport: Viewport): string {
  if (viewport.kind === "full") return "Full";
  if (viewport.kind === "ratio") return viewport.label;
  return `${viewport.label} ${viewport.w}×${viewport.h}`;
}

export function rotated(viewport: Viewport): Viewport {
  if (viewport.kind === "fixed") return { ...viewport, w: viewport.h, h: viewport.w };
  if (viewport.kind === "ratio") return { ...viewport, rw: viewport.rh, rh: viewport.rw };
  return viewport;
}

/** Pixel size for a viewport given the available canvas area (CSS px). */
export function frameSize(
  viewport: Exclude<Viewport, { kind: "full" }>,
  avail: { w: number; h: number },
): { w: number; h: number } {
  if (viewport.kind === "fixed") return { w: viewport.w, h: viewport.h };
  const scale = Math.min(avail.w / viewport.rw, avail.h / viewport.rh);
  return { w: Math.round(viewport.rw * scale), h: Math.round(viewport.rh * scale) };
}

/** Frame ↔ shell messages (same-origin postMessage). */
export type FrameToShell =
  | { hx: "route"; route: string }
  | { hx: "open-count"; count: number }
  | { hx: "exit-comments" }
  | { hx: "ready" };

export type ShellToFrame = { hx: "comments-active"; active: boolean };

export const FRAME_PREFIX = "/frame";

export function toFrameRoute(route: string, themeKey: string): string {
  return `${FRAME_PREFIX}${route}?theme=${encodeURIComponent(themeKey)}`;
}

export function fromFrameRoute(pathname: string): string {
  return pathname.startsWith(FRAME_PREFIX) ? pathname.slice(FRAME_PREFIX.length) : pathname;
}
