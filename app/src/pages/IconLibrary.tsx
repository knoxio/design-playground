import { icons, type LucideIcon } from "@design/ui/icons";
import { useEffect, useRef, useState } from "react";
import { StandalonePage } from "./Standalone";

const allIcons: [string, LucideIcon][] = Object.entries(icons);

export function IconLibrary() {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const shown = search
    ? allIcons.filter(([n]) => n.toLowerCase().includes(search.toLowerCase()))
    : allIcons;

  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="mb-1 text-2xl font-bold">Icons</h1>
      <p className="mb-6 text-muted-foreground">
        {allIcons.length.toLocaleString()} Lucide icons via{" "}
        <span className="font-mono text-sm">@design/ui/icons</span> — click one to copy its import.
      </p>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search icons…"
        className="mb-6 w-full max-w-sm rounded-md border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      />
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">No icons match "{search}".</p>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {shown.slice(0, 400).map(([name, Icon]) => {
            return (
              <button
                key={name}
                type="button"
                title={`import { ${name} } from "@design/ui/icons";`}
                onClick={() => {
                  void navigator.clipboard.writeText(`import { ${name} } from "@design/ui/icons";`);
                  setCopied(name);
                  if (timer.current) clearTimeout(timer.current);
                  timer.current = setTimeout(() => setCopied(null), 1200);
                }}
                className={`flex flex-col items-center gap-1.5 rounded-md border px-1 py-3 transition-colors duration-150 ${
                  copied === name
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-transparent hover:border-border hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="line-clamp-2 text-[10px] leading-tight break-all text-muted-foreground">
                  {copied === name ? "copied" : name}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {shown.length > 400 ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Showing 400 of {shown.length.toLocaleString()} — refine the search.
        </p>
      ) : null}
    </div>
  );
}

/** The icon catalog outside any client context, under the Design standard. */
export function GlobalIcons() {
  return (
    <StandalonePage label="Icon library">
      <IconLibrary />
    </StandalonePage>
  );
}
