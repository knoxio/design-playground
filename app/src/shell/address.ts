/**
 * The canonical address (ADR-0013). One reviewable surface, one URL:
 *
 *   /c/<client>/[x/<experiment>/<variant>/]p/<page>[/<step>][?state=<state>][#<anchor>]
 *
 * This module is the single place routing, navigation, and comment anchoring
 * agree on how a surface maps to a URL. It is pure string ↔ coordinates; the
 * registry-aware resolution (which pages/steps/states actually exist) lives in
 * `surface.ts`.
 */
export type Address = {
  clientId: string;
  experimentId?: string;
  variantId?: string;
  pageId: string;
  stepId?: string;
  state?: string;
  anchor?: string;
};

const ADDRESS_RE = /^\/c\/([^/]+)\/(?:x\/([^/]+)\/([^/]+)\/)?p\/([^/]+)(?:\/([^/]+))?\/?$/;

export function buildAddress(a: Address): string {
  const design = a.experimentId && a.variantId ? `x/${a.experimentId}/${a.variantId}/` : "";
  const step = a.stepId ? `/${a.stepId}` : "";
  const query = a.state ? `?state=${encodeURIComponent(a.state)}` : "";
  const anchor = a.anchor ? `#${a.anchor}` : "";
  return `/c/${a.clientId}/${design}p/${a.pageId}${step}${query}${anchor}`;
}

/**
 * Parse a canonical address from its parts. `search` is the raw `location.search`
 * (e.g. "?state=empty"), `hash` the raw `location.hash` ("#submit"). Returns
 * null for any path that is not a client page address.
 */
export function parseAddress(pathname: string, search = "", hash = ""): Address | null {
  const match = pathname.match(ADDRESS_RE);
  if (!match) return null;
  const [, clientId, experimentId, variantId, pageId, stepId] = match;
  if (!clientId || !pageId) return null;
  const state = new URLSearchParams(search).get("state") ?? undefined;
  const anchor = hash.startsWith("#") ? hash.slice(1) : hash || undefined;
  return {
    clientId,
    experimentId: experimentId || undefined,
    variantId: variantId || undefined,
    pageId,
    stepId: stepId || undefined,
    state: state || undefined,
    anchor: anchor || undefined,
  };
}

/** What the target page can honor: the ids of its steps (empty = leaf) and a
 *  lookup of the state ids available at a given step (or the page itself). */
export type Capabilities = {
  steps: string[];
  statesFor: (stepId: string | undefined) => string[];
};

/**
 * Best-effort coordinate preservation (ADR-0013): keep the step and state when
 * the target surface has them, otherwise drop to the nearest valid parent — a
 * non-flow target drops the step; a step/page without the named state drops the
 * state. Design (client/experiment/variant) and page are taken as given.
 */
export function preserveCoordinates(desired: Address, target: Capabilities): Address {
  let stepId: string | undefined;
  if (target.steps.length > 0) {
    stepId =
      desired.stepId && target.steps.includes(desired.stepId) ? desired.stepId : target.steps[0];
  }
  const states = target.statesFor(stepId);
  const state = desired.state && states.includes(desired.state) ? desired.state : undefined;
  return { ...desired, stepId, state };
}
