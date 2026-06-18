import { useState } from "react";
import type { ClientEntry } from "../registry/types";
import { CommentsButton } from "./CommentsButton";
import { glass } from "./glass";
import { StateTool } from "./StateTool";
import { ViewportTool } from "./ViewportTool";
import type { Viewport } from "./viewport";

type DockPanel = "state" | "viewport";

type ClientToolbarProps = {
  client: ClientEntry;
  commentsActive: boolean;
  openCommentCount: number;
  viewport: Viewport;
  onToggleComments: () => void;
  onViewportSelect: (viewport: Viewport) => void;
};

/**
 * Floating bottom-center toolbar for scoped client previews. Mirrors the
 * internal Dock's glass language but exposes only the client-appropriate
 * controls — commenting and viewport simulation. Theme and variant switching
 * stay internal-only: a client must not reskin the prototype or pick variants.
 * Carries `data-dp-ui` so its own clicks never become comment anchors.
 */
export function ClientToolbar({
  client,
  commentsActive,
  openCommentCount,
  viewport,
  onToggleComments,
  onViewportSelect,
}: ClientToolbarProps) {
  const [open, setOpen] = useState<DockPanel | null>(null);

  return (
    <div
      data-dp-ui
      className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-1.5"
    >
      <div className="flex items-center gap-2">
        {open ? (
          <div className="fixed inset-0 z-10" onClick={() => setOpen(null)} aria-hidden />
        ) : null}
        <CommentsButton
          commentsActive={commentsActive}
          openCommentCount={openCommentCount}
          onToggle={onToggleComments}
        />
        <StateTool
          client={client}
          isOpen={open === "state"}
          onToggle={() => setOpen(open === "state" ? null : "state")}
          onNavigate={() => setOpen(null)}
        />
        <ViewportTool
          viewport={viewport}
          isOpen={open === "viewport"}
          onToggle={() => setOpen(open === "viewport" ? null : "viewport")}
          onSelect={(v) => {
            onViewportSelect(v);
            setOpen(null);
          }}
        />
      </div>
      <span className={`rounded-full px-3 py-0.5 text-[11px] text-muted-foreground ${glass}`}>
        Prototype — sample data, not the final product.
      </span>
    </div>
  );
}
