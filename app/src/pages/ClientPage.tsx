import type { ComponentType } from "react";
import { Navigate, useParams, useSearchParams } from "react-router";
import { getClient } from "../registry/clients";
import type { PageEntry } from "../registry/types";
import { Flow } from "../shell/Flow";
import { resolvePages } from "../shell/surface";

/** The default render, or a named state's thunk when `?state=` selects one. */
function renderOf(page: PageEntry, state: string | null): ComponentType | undefined {
  if (state && page.states?.[state]) return page.states[state];
  return page.component;
}

export function ClientPage() {
  const { clientId, pageId, stepId, experimentId, variantId } = useParams();
  const [searchParams] = useSearchParams();
  const state = searchParams.get("state");
  const client = getClient(clientId);
  if (!client) return null;

  const pages = resolvePages(client, experimentId, variantId);
  if (!pages) return <p className="p-8 text-muted-foreground">Variant not found.</p>;

  const page = pages.find((p) => p.id === pageId);
  if (!page) return <p className="p-8 text-muted-foreground">Page not found.</p>;

  if (page.steps) {
    const base = experimentId
      ? `/c/${client.id}/x/${experimentId}/${variantId}/${page.id}`
      : `/c/${client.id}/p/${page.id}`;
    const first = page.steps[0];
    if (!stepId) {
      if (!first) return <p className="p-8 text-muted-foreground">Flow has no steps.</p>;
      return <Navigate replace to={`${base}/${first.id}`} />;
    }
    return (
      <Flow
        flow={page}
        stepId={stepId}
        state={state}
        hrefForStep={(s) => `${base}/${s}`}
        showButtons={page.flowButtons !== false}
      />
    );
  }

  const Render = renderOf(page, state);
  if (!Render) return <p className="p-8 text-muted-foreground">Page has no content.</p>;
  return <Render />;
}
