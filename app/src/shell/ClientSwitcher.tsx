import { useState } from "react";
import { Link } from "react-router";
import { clients } from "../registry/clients";
import type { ClientEntry } from "../registry/types";
import { Chevron } from "./Chevron";

export function ClientSwitcher({ current }: { current: ClientEntry }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative mb-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold transition-colors duration-150 hover:border-muted-foreground/40 hover:bg-muted"
      >
        <span className="truncate">{current.name}</span>
        <Chevron
          className={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute left-0 z-20 mt-1 w-full min-w-48 origin-top animate-slide-down rounded-md border border-border bg-background p-1 shadow-lg">
            {clients.map((client) => {
              const firstPage = client.pages[0];
              if (!firstPage) return null;
              const isCurrent = client.id === current.id;
              return (
                <Link
                  key={client.id}
                  to={`/c/${client.id}/p/${firstPage.id}`}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-2 py-1.5 text-sm transition-colors duration-150 ${
                    isCurrent
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {client.name}
                </Link>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
