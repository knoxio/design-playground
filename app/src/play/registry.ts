import type { PlayTest } from "@helix/ui";
import { clients } from "../registry/clients";
import type { PageEntry } from "../registry/types";
import { buildAddress } from "../shell/address";
import { createPlayContext } from "./dom";

export type PlayResult = { ok: boolean; error?: string };
export type PlayCase = { name: string; run: () => Promise<PlayResult> };

declare global {
  interface Window {
    /** Discovered play-tests keyed by canonical address — the runner navigates
     *  to each, then invokes `run()` against the live canvas. Internal only. */
    hxPlay?: Record<string, PlayCase>;
  }
}

const CANVAS_SELECTOR = "[data-hx-canvas]";

function caseFor(name: string, play: PlayTest): PlayCase {
  return {
    name,
    run: async () => {
      const root = document.querySelector(CANVAS_SELECTOR);
      if (!root) return { ok: false, error: "play: page canvas not found" };
      try {
        await play(createPlayContext(root));
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
  };
}

/**
 * Register every discovered Main page/step `play` export on `window.hxPlay`,
 * keyed by its canonical address. Internal builds only — the Playwright play
 * runner enumerates and drives these; the in-app runner (v2) will reuse them.
 */
export function installPlayRegistry(): void {
  const registry: Record<string, PlayCase> = {};
  const add = (clientId: string, page: PageEntry, stepId?: string, play?: PlayTest) => {
    if (!play) return;
    const address = buildAddress({ clientId, pageId: page.id, stepId });
    registry[address] = caseFor(`${clientId} ${page.id}${stepId ? `/${stepId}` : ""}`, play);
  };
  for (const client of clients) {
    for (const page of client.pages) {
      if (page.steps) for (const step of page.steps) add(client.id, page, step.id, step.play);
      else add(client.id, page, undefined, page.play);
    }
  }
  window.hxPlay = registry;
}
