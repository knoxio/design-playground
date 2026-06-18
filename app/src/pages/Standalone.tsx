import { helixTokens, kitManifest } from "@helix/ui";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { ClientTheme } from "../shell/ClientTheme";
import { HelixMark } from "../shell/HelixMark";
import { KitCatalog } from "./KitCatalog";
import { TokensGallery } from "./TokensGallery";

/** Chrome header + Helix-standard canvas for pages outside any client. */
export function StandalonePage({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-8 py-3">
        <Link
          to="/"
          className="flex items-center gap-2 text-foreground transition-opacity duration-150 hover:opacity-80"
        >
          <HelixMark animated={false} className="h-4 w-3" />
          <span className="font-display text-xs font-semibold tracking-[0.2em] uppercase">
            Helix
          </span>
        </Link>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <ClientTheme tokens={helixTokens}>{children}</ClientTheme>
    </div>
  );
}

export function GlobalTokens() {
  return (
    <StandalonePage label="Tokens · Helix standard — for a client's brand, open that client's tokens page">
      <TokensGallery />
    </StandalonePage>
  );
}

export function GlobalComponents() {
  return (
    <StandalonePage label="Shared kit components">
      <div className="mx-auto max-w-4xl p-8">
        <h1 className="mb-1 text-2xl font-bold">Shared kit · {kitManifest.length}</h1>
        <p className="mb-8 text-muted-foreground">
          The component catalog under the Helix standard theme.
        </p>
        <KitCatalog />
      </div>
    </StandalonePage>
  );
}
