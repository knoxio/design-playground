import { useEffect, useState } from "react";
import { Outlet, useLocation, useMatch, useParams, useSearchParams } from "react-router";
import { getClient } from "../registry/clients";
import { ClientTheme } from "./ClientTheme";
import { CommentsOverlay } from "./comments/CommentsOverlay";
import { resolveTheme } from "./theme";
import { fromFrameRoute, type FrameToShell, type ShellToFrame } from "./viewport";

function post(message: FrameToShell): void {
  window.parent.postMessage(message, window.location.origin);
}

/**
 * The chrome-less render mode the viewport tool's iframe loads: the page
 * under its resolved theme plus the comments overlay, nothing else. The
 * shell drives comment activation and follows frame navigation via
 * same-origin postMessage; thread routes stay canonical (/c/…) so comments
 * made framed and unframed are the same threads.
 */
export function FrameShell() {
  const { clientId } = useParams();
  const client = getClient(clientId);
  const location = useLocation();
  const [search] = useSearchParams();
  const variantMatch = useMatch("/frame/c/:clientId/x/:experimentId/:variantId/:pageId");
  const tokensMatch = useMatch("/frame/c/:clientId/tokens");
  const componentsMatch = useMatch("/frame/c/:clientId/components");
  const [commentsActive, setCommentsActive] = useState(false);

  const canonicalRoute = fromFrameRoute(location.pathname);

  useEffect(() => {
    post({ kind: "route", route: canonicalRoute });
  }, [canonicalRoute]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as ShellToFrame;
      if (data.kind === "comments-active") setCommentsActive(data.active);
    };
    window.addEventListener("message", onMessage);
    post({ kind: "ready" });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!client) return null;

  const { currentThemeKey, tokens } = resolveTheme({
    client,
    experimentId: variantMatch?.params.experimentId,
    variantId: variantMatch?.params.variantId,
    isGallery: tokensMatch !== null || componentsMatch !== null,
    overrideKey: search.get("theme") ?? undefined,
  });

  return (
    <div>
      <ClientTheme tokens={tokens}>
        <div className="min-h-screen">
          <Outlet />
        </div>
      </ClientTheme>
      <CommentsOverlay
        active={commentsActive}
        clientId={client.id}
        themeKey={currentThemeKey}
        route={canonicalRoute}
        internal={!import.meta.env.VITE_CLIENT}
        onOpenCount={(count) => post({ kind: "open-count", count })}
        onExit={() => post({ kind: "exit-comments" })}
      />
    </div>
  );
}
