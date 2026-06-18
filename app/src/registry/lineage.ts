import type { ExperimentEntry, PageEntry } from "./types";

/**
 * Attach each experiment to the page-tree node it explores and enforce the
 * cross-reference rules (ADR-0012). Every experiment's `page` must resolve to a
 * Main page or to a page introduced by one of the experiment's own variants (a
 * page may exist only for an experiment); an unresolved `page` is a contract
 * error. At most one *active* experiment may be in scope on a given lineage —
 * in the flat page tree a lineage is a single page id. Mutates the matching
 * `pages[].experiments` and appends any contract errors.
 */
export function linkExperimentsToPages(
  clientId: string,
  pages: PageEntry[],
  experiments: ExperimentEntry[],
  errors: string[],
): void {
  const mainPages = new Map(pages.map((p) => [p.id, p]));
  const lineageOwner = new Map<string, string>();

  for (const exp of experiments) {
    const variantPages = exp.variants.flatMap((v) => v.pages);
    const resolves = mainPages.has(exp.page) || variantPages.some((p) => p.id === exp.page);
    if (!resolves) {
      errors.push(
        `clients/${clientId}/experiments/${exp.id}: page "${exp.page}" matches no Main page or page in this experiment's variants`,
      );
      continue;
    }
    mainPages.get(exp.page)?.experiments.push(exp);

    if (exp.status !== "active") continue;
    const prior = lineageOwner.get(exp.page);
    if (prior !== undefined) {
      errors.push(
        `clients/${clientId}/experiments/${exp.id}: page "${exp.page}" already hosts active experiment "${prior}" — at most one experiment per lineage (ADR-0012)`,
      );
    } else {
      lineageOwner.set(exp.page, exp.id);
    }
  }
}
