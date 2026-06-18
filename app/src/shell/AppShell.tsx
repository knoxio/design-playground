import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useMatch, useNavigate, useParams } from "react-router";
import { Blocks, Palette, Shapes } from "@design/ui/icons";
import { getClient, globalThemeErrors } from "../registry/clients";
import { buildAddress, parseAddress } from "./address";
import { Chevron } from "./Chevron";
import { ClientSwitcher } from "./ClientSwitcher";
import { ClientToolbar } from "./ClientToolbar";
import { Dock } from "./Dock";
import { ShellCanvas } from "./ShellCanvas";
import { SidebarNav } from "./SidebarNav";
import { resolveTheme } from "./theme";
import { FULL, type Viewport } from "./viewport";

const SIDEBAR_KEY = "dp-sidebar";

export function AppShell() {
  const { clientId } = useParams();
  const client = getClient(clientId);
  const location = useLocation();
  const variantMatch = useMatch("/c/:clientId/x/:experimentId/:variantId/*");
  const tokensMatch = useMatch("/c/:clientId/tokens");
  const componentsMatch = useMatch("/c/:clientId/components");
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === "collapsed",
  );
  const [themeOverride, setThemeOverride] = useState<{
    clientId: string;
    key: string;
  } | null>(null);
  const [commentsActive, setCommentsActive] = useState(false);
  const [openCommentCount, setOpenCommentCount] = useState(0);
  const [viewport, setViewport] = useState<Viewport>(FULL);
  const navigate = useNavigate();
  const scopedPreview = Boolean(import.meta.env.VITE_CLIENT);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? "collapsed" : "open");
  }, [collapsed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "i" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
      )
        return;
      setCommentsActive((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!client) {
    return (
      <div className="p-8">
        <p>Unknown client.</p>
        <Link className="text-primary underline" to="/">
          Back to overview
        </Link>
      </div>
    );
  }

  const { themeOptions, currentThemeKey, tokens } = resolveTheme({
    client,
    experimentId: variantMatch?.params.experimentId,
    variantId: variantMatch?.params.variantId,
    isGallery: tokensMatch !== null || componentsMatch !== null,
    overrideKey: themeOverride?.clientId === client.id ? themeOverride.key : undefined,
  });
  const themeErrors = [...globalThemeErrors, ...client.errors.filter((e) => e.includes("theme"))];

  // The thread route is the canonical address (page + step + state), so a
  // comment anchors to the exact surface and reopens on the right state.
  const parsedAddress = parseAddress(location.pathname, location.search);
  const route = parsedAddress
    ? buildAddress({ ...parsedAddress, anchor: undefined })
    : location.pathname;

  return (
    <div className="flex h-screen flex-col">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          className={`relative h-full shrink-0 transition-[width] duration-300 ease-in-out ${
            collapsed ? "w-0" : "w-64"
          }`}
        >
          <div className="h-full overflow-hidden">
            <aside
              className={`flex h-full w-64 flex-col border-r border-border bg-muted/50 transition-opacity duration-200 ${
                collapsed ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
            >
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="mb-6">
                  <Link
                    to="/"
                    className="flex items-center gap-2 text-foreground transition-opacity duration-150 hover:opacity-80"
                  >
                    <span className="font-display text-sm font-semibold tracking-[0.2em] uppercase">
                      Design
                    </span>
                    <span className="font-display text-sm font-light tracking-[0.2em] text-muted-foreground uppercase">
                      Playground
                    </span>
                  </Link>
                </div>
                <ClientSwitcher current={client} />
                <SidebarNav client={client} />
              </div>
              <nav className="grid grid-cols-3 gap-1 border-t border-border p-2">
                {[
                  { to: `/c/${client.id}/tokens`, label: "Tokens", Icon: Palette },
                  { to: `/c/${client.id}/components`, label: "Components", Icon: Blocks },
                  { to: `/c/${client.id}/icons`, label: "Icons", Icon: Shapes },
                ].map(({ to, label, Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex flex-col items-center gap-1 rounded-md py-2 text-[10px] transition-colors duration-150 ${
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                ))}
              </nav>
            </aside>
          </div>
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((v) => !v)}
            className="absolute top-1/2 -right-6 z-30 flex h-14 w-6 -translate-y-1/2 items-center justify-center rounded-r-full border border-l-0 border-border bg-muted text-muted-foreground shadow-sm transition-colors duration-150 hover:text-foreground"
          >
            <Chevron
              className={`h-5 w-5 transition-transform duration-300 ${collapsed ? "-rotate-90" : "rotate-90"}`}
            />
          </button>
        </div>
        <ShellCanvas
          viewport={viewport}
          tokens={tokens}
          route={route}
          clientId={client.id}
          themeKey={currentThemeKey}
          internal={!scopedPreview}
          commentsActive={commentsActive}
          onOpenCount={setOpenCommentCount}
          onExitComments={() => setCommentsActive(false)}
          onNavigate={(to) => void navigate(to, { replace: true })}
          onResize={(w, h) => setViewport({ kind: "fixed", label: "Custom", w, h })}
        />
        {scopedPreview ? (
          <ClientToolbar
            client={client}
            commentsActive={commentsActive}
            openCommentCount={openCommentCount}
            viewport={viewport}
            onToggleComments={() => setCommentsActive((v) => !v)}
            onViewportSelect={setViewport}
          />
        ) : (
          <Dock
            client={client}
            themeOptions={themeOptions}
            currentThemeKey={currentThemeKey}
            themeErrors={themeErrors}
            commentsActive={commentsActive}
            openCommentCount={openCommentCount}
            viewport={viewport}
            onViewportSelect={setViewport}
            onToggleComments={() => setCommentsActive((v) => !v)}
            onThemeSelect={(key) => setThemeOverride({ clientId: client.id, key })}
          />
        )}
      </div>
    </div>
  );
}
