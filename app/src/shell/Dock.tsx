import { helixTokens } from "@helix/ui";
import { useState } from "react";
import { CommentsButton } from "./CommentsButton";
import type { ClientEntry, ThemeEntry } from "../registry/types";
import { glass, panel } from "./glass";
import { StateTool } from "./StateTool";
import { VariantTool } from "./VariantTool";
import { ViewportTool } from "./ViewportTool";
import type { Viewport } from "./viewport";

type DockPanel = "themes" | "variants" | "state" | "viewport";

type DockProps = {
  client: ClientEntry;
  themeOptions: ThemeEntry[];
  currentThemeKey: string;
  themeErrors: string[];
  commentsActive: boolean;
  openCommentCount: number;
  viewport: Viewport;
  onViewportSelect: (viewport: Viewport) => void;
  onToggleComments: () => void;
  onThemeSelect: (key: string) => void;
};

/**
 * Floating bottom-center dock over the prototype canvas. Hosts the prototype
 * tools: comments toggle, theme switcher, and the variant pill. Chrome —
 * never themed by the client; internal builds only.
 */
export function Dock({
  client,
  themeOptions,
  currentThemeKey,
  themeErrors,
  commentsActive,
  openCommentCount,
  viewport,
  onViewportSelect,
  onToggleComments,
  onThemeSelect,
}: DockProps) {
  const [open, setOpen] = useState<DockPanel | null>(null);

  return (
    <div
      data-hx-ui
      className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2"
    >
      {open ? (
        <div className="fixed inset-0 z-10" onClick={() => setOpen(null)} aria-hidden />
      ) : null}
      <CommentsButton
        commentsActive={commentsActive}
        openCommentCount={openCommentCount}
        onToggle={onToggleComments}
      />
      <ThemeTool
        client={client}
        themeOptions={themeOptions}
        currentThemeKey={currentThemeKey}
        themeErrors={themeErrors}
        isOpen={open === "themes"}
        onToggle={() => setOpen(open === "themes" ? null : "themes")}
        onSelect={(key) => {
          onThemeSelect(key);
          setOpen(null);
        }}
      />
      <VariantTool
        client={client}
        isOpen={open === "variants"}
        onToggle={() => setOpen(open === "variants" ? null : "variants")}
        onNavigate={() => setOpen(null)}
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
  );
}

const scopeLabels: Record<ThemeEntry["scope"], string> = {
  client: "Client themes",
  experiment: "Experiment themes",
  variant: "Variant themes",
  global: "Global themes",
};

const themeItemClass = (active: boolean) =>
  `flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-sm transition-colors duration-150 ${
    active ? "bg-accent font-medium text-accent-foreground" : "text-foreground hover:bg-muted"
  }`;

function ThemeTool({
  client,
  themeOptions,
  currentThemeKey,
  themeErrors,
  isOpen,
  onToggle,
  onSelect,
}: {
  client: ClientEntry;
  themeOptions: ThemeEntry[];
  currentThemeKey: string;
  themeErrors: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (key: string) => void;
}) {
  const groups = (["client", "experiment", "variant", "global"] as const)
    .map((scope) => ({
      label: scopeLabels[scope],
      entries: themeOptions.filter((t) => t.scope === scope),
    }))
    .filter((g) => g.entries.length > 0);
  const currentSwatch =
    themeOptions.find((t) => t.key === currentThemeKey)?.tokens.colors.primary ??
    helixTokens.colors.primary;

  return (
    <div className="relative">
      {isOpen ? (
        <div className={`left-0 w-60 ${panel}`}>
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-2 pt-2 pb-1 text-xs font-semibold text-muted-foreground uppercase">
                {group.label}
              </p>
              {group.entries.map((theme) => (
                <button
                  key={theme.key}
                  type="button"
                  onClick={() => onSelect(theme.key)}
                  className={themeItemClass(theme.key === currentThemeKey)}
                >
                  <span
                    aria-hidden
                    className="h-3 w-3 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: theme.tokens.colors.primary }}
                  />
                  <span className="truncate">
                    {theme.scope === "client" && theme.id === client.defaultTheme
                      ? `${theme.id} (default)`
                      : theme.id}
                    {theme.ownerLabel ? (
                      <span className="text-muted-foreground"> · {theme.ownerLabel}</span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        aria-label={
          themeErrors.length > 0 ? "Switch theme (some themes failed to load)" : "Switch theme"
        }
        aria-expanded={isOpen}
        onClick={onToggle}
        title={themeErrors.length > 0 ? themeErrors.join("\n") : undefined}
        className={`relative z-20 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-150 hover:scale-105 hover:bg-background/90 active:scale-95 ${glass}`}
      >
        <span
          aria-hidden
          className="h-3.5 w-3.5 rounded-full border border-border"
          style={{ backgroundColor: currentSwatch }}
        />
        {themeErrors.length > 0 ? (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-background bg-destructive"
          />
        ) : null}
      </button>
    </div>
  );
}
