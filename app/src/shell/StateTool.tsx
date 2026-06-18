import { useMatch, useSearchParams } from "react-router";
import type { ClientEntry } from "../registry/types";
import { Chevron } from "./Chevron";
import { glass, panel } from "./glass";
import { resolveSurface, statesAt, type SurfaceCoords } from "./surface";

type Match = ReturnType<typeof useMatch>;

function coordsFromMatches(variant: Match, main: Match): SurfaceCoords | null {
  if (variant) {
    const [pageId, stepId] = (variant.params["*"] ?? "").split("/");
    return {
      experimentId: variant.params.experimentId,
      variantId: variant.params.variantId,
      pageId,
      stepId,
    };
  }
  if (main) {
    const [pageId, stepId] = (main.params["*"] ?? "").split("/");
    return { pageId, stepId };
  }
  return null;
}

const itemClass = (active: boolean) =>
  `flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-sm transition-colors duration-150 ${
    active ? "bg-accent font-medium text-accent-foreground" : "text-foreground hover:bg-muted"
  }`;

/**
 * The state switcher (ADR-0011): lists the named states of the current surface
 * (the active step if a flow, else the page) plus Default, and drives the
 * `?state=` coordinate. Renders nothing when the surface has no named states.
 */
export function StateTool({
  client,
  isOpen,
  onToggle,
  onNavigate,
}: {
  client: ClientEntry;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const variantMatch = useMatch("/c/:clientId/x/:experimentId/:variantId/*");
  const mainMatch = useMatch("/c/:clientId/p/*");
  const [searchParams, setSearchParams] = useSearchParams();

  const coords = coordsFromMatches(variantMatch, mainMatch);
  const states = coords ? statesAt(resolveSurface(client, coords)) : [];
  if (states.length === 0) return null;

  const current = searchParams.get("state") ?? "default";
  const options = ["default", ...states];
  const select = (id: string) => {
    const next = new URLSearchParams(searchParams);
    if (id === "default") next.delete("state");
    else next.set("state", id);
    setSearchParams(next);
    onNavigate();
  };

  return (
    <div className="relative">
      {isOpen ? (
        <div className={`left-1/2 w-48 -translate-x-1/2 ${panel}`}>
          {options.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => select(id)}
              className={itemClass(id === current)}
            >
              <span className="truncate capitalize">{id}</span>
              {id === current ? <span className="text-xs text-muted-foreground">●</span> : null}
            </button>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        aria-label="Switch state"
        aria-expanded={isOpen}
        onClick={onToggle}
        className={`relative z-20 rounded-full px-4 py-2 text-sm font-medium text-foreground transition-all duration-150 hover:scale-[1.03] hover:bg-background/90 active:scale-95 ${glass}`}
      >
        <span className="inline-flex items-center gap-1.5 capitalize">
          {current}
          <Chevron
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "" : "rotate-180"}`}
          />
        </span>
      </button>
    </div>
  );
}
