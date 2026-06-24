import type { PlayTest } from "@design/ui";
import type { ComponentType } from "react";
import { pageMetaSchema, statesSchema } from "./schemas";
import type { PageEntry } from "./types";
import { relativeToClients } from "./yaml";

type Modules = Record<string, Record<string, unknown>>;

/** Read the optional `states` export; a malformed one is a contract error, not a crash. */
function parseStates(
  raw: unknown,
  path: string,
  errors: string[],
): Record<string, ComponentType> | undefined {
  if (raw === undefined) return undefined;
  const parsed = statesSchema.safeParse(raw);
  if (!parsed.success) {
    errors.push(
      `clients/${path}: invalid \`states\` export — must be a map of name → render thunk`,
    );
    return undefined;
  }
  return Object.keys(parsed.data).length > 0 ? parsed.data : undefined;
}

function parsePageModule(
  mod: Record<string, unknown>,
  id: string,
  path: string,
  errors: string[],
): PageEntry | null {
  const component = mod.default;
  if (typeof component !== "function" && (typeof component !== "object" || component === null)) {
    errors.push(`clients/${path}: missing default component export`);
    return null;
  }
  const meta = pageMetaSchema.safeParse(mod.meta);
  if (!meta.success) {
    errors.push(`clients/${path}: missing or invalid \`meta\` export (needs { title })`);
    return null;
  }
  if (mod.play !== undefined && typeof mod.play !== "function") {
    errors.push(`clients/${path}: \`play\` export must be a function (a PlayTest)`);
  }
  return {
    id,
    title: meta.data.title,
    order: meta.data.order ?? Number.MAX_SAFE_INTEGER,
    component: component as ComponentType,
    flowButtons: meta.data.flowButtons,
    states: parseStates(mod.states, path, errors),
    play: typeof mod.play === "function" ? (mod.play as PlayTest) : undefined,
    experiments: [],
  };
}

function byOrder(a: PageEntry, b: PageEntry): number {
  return a.order - b.order || a.id.localeCompare(b.id);
}

/** "request-quote" → "Request quote" — a flow folder has no file to carry a title. */
function prettifyId(id: string): string {
  const spaced = id.replace(/-/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function collectLeafPages(modules: Modules, prefix: string, errors: string[]): PageEntry[] {
  const pages: PageEntry[] = [];
  for (const [globPath, mod] of Object.entries(modules)) {
    const path = relativeToClients(globPath);
    if (!path.startsWith(prefix)) continue;
    const id = path.slice(prefix.length).replace(/\.tsx$/, "");
    if (id.includes("/")) continue;
    const page = parsePageModule(mod, id, path, errors);
    if (page) pages.push(page);
  }
  return pages;
}

function collectFlowPages(modules: Modules, prefix: string, errors: string[]): PageEntry[] {
  const stepsByFlow = new Map<string, PageEntry[]>();
  for (const [globPath, mod] of Object.entries(modules)) {
    const path = relativeToClients(globPath);
    if (!path.startsWith(prefix)) continue;
    const rest = path.slice(prefix.length).replace(/\.tsx$/, "");
    const [flowId, stepId] = rest.split("/");
    if (flowId === undefined || stepId === undefined) continue;
    const step = parsePageModule(mod, stepId, path, errors);
    if (!step) continue;
    const steps = stepsByFlow.get(flowId) ?? [];
    steps.push(step);
    stepsByFlow.set(flowId, steps);
  }
  return [...stepsByFlow.entries()].map(([flowId, steps]) => ({
    id: flowId,
    title: prettifyId(flowId),
    order: Math.min(...steps.map((s) => s.order)),
    steps: steps.toSorted(byOrder),
    flowButtons: steps.every((s) => s.flowButtons !== false),
    experiments: [],
  }));
}

function reportOverNesting(deepModules: Modules, prefix: string, errors: string[]): void {
  for (const globPath of Object.keys(deepModules)) {
    const path = relativeToClients(globPath);
    if (!path.startsWith(prefix)) continue;
    errors.push(`clients/${path}: a flow is one level deep — a step cannot be a folder (ADR-0010)`);
  }
}

export type CollectPagesArgs = {
  leafModules: Modules;
  flowModules: Modules;
  deepModules: Modules;
  prefix: string;
  errors: string[];
};

/**
 * Discover the pages under `prefix`: single `.tsx` files are leaf pages, a
 * folder of step files is a flow (ordered steps). A page id used by both a file
 * and a folder, or a step nested more than one level deep, is a contract error.
 */
export function collectPages({
  leafModules,
  flowModules,
  deepModules,
  prefix,
  errors,
}: CollectPagesArgs): PageEntry[] {
  const leaves = collectLeafPages(leafModules, prefix, errors);
  const flows = collectFlowPages(flowModules, prefix, errors);
  reportOverNesting(deepModules, prefix, errors);

  const leafIds = new Set(leaves.map((p) => p.id));
  for (const flow of flows) {
    if (leafIds.has(flow.id)) {
      errors.push(
        `clients/${prefix}${flow.id}: page id is both a file and a flow folder — choose one (ADR-0010)`,
      );
    }
  }
  return [...leaves, ...flows].toSorted(byOrder);
}
