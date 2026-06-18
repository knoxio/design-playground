import { Outlet } from "react-router";
import type { TokenSet } from "@helix/ui";
import { ClientTheme } from "./ClientTheme";
import { CommentsOverlay } from "./comments/CommentsOverlay";
import type { Viewport } from "./viewport";
import { ViewportFrame } from "./ViewportFrame";

/**
 * The prototype canvas. At Full it renders the page directly with the
 * comments overlay alongside; under a simulated viewport it hosts the
 * frame instead, which owns its own overlay so capture and dots live at
 * the simulated size.
 */
export function ShellCanvas({
  viewport,
  tokens,
  route,
  clientId,
  themeKey,
  internal,
  commentsActive,
  onOpenCount,
  onExitComments,
  onNavigate,
  onResize,
}: {
  viewport: Viewport;
  tokens: TokenSet;
  route: string;
  clientId: string;
  themeKey: string;
  internal: boolean;
  commentsActive: boolean;
  onOpenCount: (count: number) => void;
  onExitComments: () => void;
  onNavigate: (route: string) => void;
  onResize: (w: number, h: number) => void;
}) {
  if (viewport.kind !== "full") {
    return (
      <main className="h-full min-w-0 flex-1 overflow-hidden">
        <ViewportFrame
          viewport={viewport}
          route={route}
          themeKey={themeKey}
          commentsActive={commentsActive}
          onRouteChange={onNavigate}
          onOpenCount={onOpenCount}
          onExitComments={onExitComments}
          onResize={onResize}
        />
      </main>
    );
  }
  return (
    <>
      <main data-hx-canvas className="h-full min-w-0 flex-1 overflow-y-auto">
        <ClientTheme tokens={tokens}>
          <div key={route} className="min-h-full animate-fade-in">
            <Outlet />
          </div>
        </ClientTheme>
      </main>
      <CommentsOverlay
        active={commentsActive}
        clientId={clientId}
        themeKey={themeKey}
        route={route}
        internal={internal}
        onOpenCount={onOpenCount}
        onExit={onExitComments}
      />
    </>
  );
}
