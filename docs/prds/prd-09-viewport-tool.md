# PRD-09 — Viewport tool & client-view toolbar

**Status:** Built
**Owns:** C17 (viewport simulation); the client-view bottom toolbar on scoped previews
**Depends on:** PRD-04 (the dock), PRD-05 (comments must work inside the frame), PRD-06 (the toolbar hosts the one client-facing tool on previews)
**Governing ADRs:** [0007-scoped-previews-physical-exclusion](../adr/0007-scoped-previews-physical-exclusion.md), [0017-feedback-engine-is-claude-session](../adr/0017-feedback-engine-is-claude-session.md)

## Problem

The prototype renders at whatever size the reviewer's window happens to be. Mary
demos on a large display; clients open previews on laptops, phones, and tablets,
and "looks broken on my iPad" is a feedback class the playground can neither
reproduce nor get ahead of. Reviewing a page at phone, tablet, and ratio sizes
is one click, not a dev-tools excursion. The client-facing surface also presents
the same polished controls as the internal one — without ever offering a client
the controls that are Helix-only.

## Design

### Viewport tool on the dock

- A dock tool shows the active viewport (default **Full**). Its panel lists Full ·
  Phone 390×844 · Tablet 820×1180 · Laptop 1280×800 · ratios 16:9 · 4:3 · 1:1 —
  generic sizes, not named devices, so the list never goes stale. A rotate toggle
  swaps width and height (ratios invert).
- **Full is the zero-cost default:** the canvas renders exactly as without the
  tool — no frame in the tree, no overhead.
- Any other choice renders the page in a **same-origin iframe** at the preset's
  CSS pixel size, centered on the backdrop. An iframe, not a constrained
  container — responsive utilities respond to the real viewport, so breakpoints
  fire the way a device would.
- When the frame is larger than the available canvas it **scales to fit** with a
  zoom indicator ("80%") while keeping its true CSS pixel size — layout stays
  honest, the whole screen stays visible.
- When not Full the frame shows **corner drag handles**; dragging resizes it live
  and flips the label to **Custom W×H**. Drag coordinates map correctly under
  scale-to-fit.
- Session state, like the theme override — not persisted, resets on load.

### The frame route

A chrome-less render mode the iframe loads: the page content under the resolved
theme, nothing else — no sidebar, dock, or banner. Frame navigation (links inside
the prototype) syncs back to the shell's route so the sidebar, dock, and comment
context follow. Theme overrides and variant flips apply inside the frame exactly
as on the plain canvas.

### Comments inside the frame

The comment overlay captures, anchors, and renders dots inside the frame
(same-origin), with positions mapped through the scale factor. A comment made
under a simulated viewport records that size as the thread's `viewport` —
"cramped at 390×844" carries its reproduction context.

### Client-view toolbar

Internal and client surfaces share one floating glass bottom-bar shell so they
never drift. The internal surface mounts the full **Dock** (theme switcher,
variant flip, viewport, comments); the scoped preview mounts a **client toolbar**
in the same glass language, hosting only the client-appropriate controls:
comments (PRD-05) and the prototype disclaimer. Theme and variant switching stay
internal-only — a client never picks a variant or reskins the prototype (ADR
[0007](../adr/0007-scoped-previews-physical-exclusion.md), PRD-06). The viewport
tool is internal-only by default: clients hold the real device.

## Behavior / acceptance

1. A page using responsive utilities renders its phone layout under the Phone
   preset (breakpoints fire), not a squeezed desktop layout.
2. Corner-dragging flips the tool to Custom with live W×H; the rendered frame
   matches the displayed CSS-pixel size.
3. A preset larger than the canvas scales to fit, shows the zoom factor, and drag
   still tracks the cursor.
4. A comment made under Tablet records `viewport: 820x1180` and its dot lands on
   the commented element inside the frame.
5. Full renders byte-identical to the pre-tool canvas (no iframe mounted).
6. Theme switch and variant flip both apply inside an active frame.
7. A scoped preview presents the floating client toolbar in the dock's glass
   language with comments and the disclaimer only — no theme or variant control.

## Non-goals

- Device emulation beyond size — no user-agent spoofing, touch-event simulation,
  or devicePixelRatio emulation.
- A named-device catalog — generic sizes cover review; dev-tools exist for
  pixel-perfect device QA.
- Exposing the viewport tool on client previews by default.
