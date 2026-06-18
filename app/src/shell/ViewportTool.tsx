import { RotateCcw, Scan } from "@helix/ui/icons";
import { glass, panel } from "./glass";
import { rotated, VIEWPORT_PRESETS, viewportLabel, type Viewport } from "./viewport";

const itemClass = (active: boolean) =>
  `flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-sm transition-colors duration-150 ${
    active ? "bg-accent font-medium text-accent-foreground" : "text-foreground hover:bg-muted"
  }`;

/** Dock tool: simulated screen sizes — presets, ratios, rotate, drag-to-custom. */
export function ViewportTool({
  viewport,
  isOpen,
  onToggle,
  onSelect,
}: {
  viewport: Viewport;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (viewport: Viewport) => void;
}) {
  const active = viewport.kind !== "full";
  return (
    <div className="relative">
      {isOpen ? (
        <div className={`left-0 w-56 ${panel}`}>
          {VIEWPORT_PRESETS.map((preset) => {
            const current =
              preset.kind === viewport.kind &&
              (preset.kind === "full" || viewportLabel(preset) === viewportLabel(viewport));
            return (
              <button
                key={viewportLabel(preset)}
                type="button"
                onClick={() => onSelect(preset)}
                className={itemClass(current)}
              >
                <span>{preset.kind === "fixed" ? preset.label : viewportLabel(preset)}</span>
                {preset.kind === "fixed" ? (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {preset.w}×{preset.h}
                  </span>
                ) : null}
              </button>
            );
          })}
          {active ? (
            <button
              type="button"
              onClick={() => onSelect(rotated(viewport))}
              className={itemClass(false)}
            >
              <span className="flex items-center gap-1.5">
                <RotateCcw className="h-3 w-3" /> Rotate
              </span>
            </button>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        aria-label="Simulated screen size"
        aria-expanded={isOpen}
        title={`Viewport: ${viewportLabel(viewport)}`}
        onClick={onToggle}
        className={`relative z-20 flex h-9 items-center justify-center gap-1.5 rounded-full px-3 transition-all duration-150 hover:scale-105 active:scale-95 ${glass} ${
          active ? "bg-primary text-primary-foreground" : "hover:bg-background/90"
        }`}
      >
        <Scan className="h-4 w-4" />
        {active ? <span className="text-xs font-medium">{viewportLabel(viewport)}</span> : null}
      </button>
    </div>
  );
}
