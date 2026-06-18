import type { ClientEntry, PageEntry } from "../registry/types";
import type { Capabilities } from "./address";

export type SurfaceCoords = {
  experimentId?: string;
  variantId?: string;
  pageId?: string;
  stepId?: string;
};

/**
 * The page set visible for a design: Main pages, or a variant's pages overlaid
 * onto Main by id (the variant overlay from PRD-04). Null when the named
 * experiment/variant does not exist.
 */
export function resolvePages(
  client: ClientEntry,
  experimentId: string | undefined,
  variantId: string | undefined,
): PageEntry[] | null {
  if (!experimentId) return client.pages;
  const variant = client.experiments
    .find((e) => e.id === experimentId)
    ?.variants.find((v) => v.id === variantId);
  if (!variant) return null;
  const overridden = new Set(variant.pages.map((p) => p.id));
  return [...client.pages.filter((p) => !overridden.has(p.id)), ...variant.pages];
}

export type Surface = { page?: PageEntry; step?: PageEntry };

/** Resolve the active page and (for a flow) step from URL coordinates. */
export function resolveSurface(client: ClientEntry, coords: SurfaceCoords): Surface {
  const pages = resolvePages(client, coords.experimentId, coords.variantId);
  const page = pages?.find((p) => p.id === coords.pageId);
  if (!page) return {};
  if (page.steps)
    return { page, step: page.steps.find((s) => s.id === coords.stepId) ?? page.steps[0] };
  return { page };
}

/** The named state ids available on the active surface (the step if a flow, else the page). */
export function statesAt(surface: Surface): string[] {
  const target = surface.step ?? surface.page;
  return target?.states ? Object.keys(target.states) : [];
}

/** What a target page can honor, for best-effort coordinate preservation. */
export function capabilitiesFor(
  client: ClientEntry,
  experimentId: string | undefined,
  variantId: string | undefined,
  pageId: string,
): Capabilities {
  const page = resolvePages(client, experimentId, variantId)?.find((p) => p.id === pageId);
  const steps = page?.steps?.map((s) => s.id) ?? [];
  return {
    steps,
    statesFor: (stepId) => {
      if (!page) return [];
      const target = page.steps ? (page.steps.find((s) => s.id === stepId) ?? page.steps[0]) : page;
      return target?.states ? Object.keys(target.states) : [];
    },
  };
}
