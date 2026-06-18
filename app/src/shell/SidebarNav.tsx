import { Link, NavLink, useMatch } from "react-router";
import type { ClientEntry, ExperimentEntry, PageEntry } from "../registry/types";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-1.5 text-sm transition-colors duration-150 ${
    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
  }`;

type PageNode = {
  pageId: string;
  title: string;
  page?: PageEntry;
  experiments: ExperimentEntry[];
};

/**
 * The sidebar page tree. Main pages list their attached experiments inline;
 * an experiment whose page exists only in its own variants becomes its own
 * node (no Main to fall back to). Decided/archived experiments render nowhere.
 */
function pageNodes(client: ClientEntry): PageNode[] {
  const mainPageIds = new Set(client.pages.map((p) => p.id));
  const nodes: PageNode[] = client.pages.map((page) => ({
    pageId: page.id,
    title: page.title,
    page,
    experiments: page.experiments.filter((e) => e.status === "active"),
  }));
  for (const exp of client.experiments) {
    if (exp.status !== "active" || mainPageIds.has(exp.page)) continue;
    nodes.push({ pageId: exp.page, title: exp.page, experiments: [exp] });
  }
  return nodes;
}

/** The steps of an active flow, as deep-linkable sub-routes under `base`. */
function FlowSteps({ base, steps }: { base: string; steps: PageEntry[] }) {
  return (
    <div className="mt-0.5 ml-3 border-l border-border pl-2">
      {steps.map((step) => (
        <NavLink key={step.id} to={`${base}/${step.id}`} className={navLinkClass}>
          {step.title}
        </NavLink>
      ))}
    </div>
  );
}

/**
 * The in-place variant switch for one experiment, anchored to the page it
 * explores: Main (only when that page exists in Main) plus each variant, every
 * link landing on the same page so flipping a variant never leaves it. When the
 * active variant realizes the page as a flow, its steps expand beneath it.
 */
function VariantSwitch({
  clientId,
  exp,
  isMain,
  activeVariantId,
}: {
  clientId: string;
  exp: ExperimentEntry;
  isMain: boolean;
  activeVariantId: string | undefined;
}) {
  return (
    <div className="mt-1 ml-3 border-l border-border pl-2">
      <p className="px-3 py-0.5 text-xs font-medium text-foreground" title={exp.question}>
        {exp.name}
      </p>
      {isMain ? (
        <NavLink end to={`/c/${clientId}/p/${exp.page}`} className={navLinkClass}>
          Main
        </NavLink>
      ) : null}
      {exp.variants.map((variant) => {
        const base = `/c/${clientId}/x/${exp.id}/${variant.id}/${exp.page}`;
        const realization = variant.pages.find((p) => p.id === exp.page);
        const active = activeVariantId === variant.id;
        return (
          <div key={variant.id}>
            <Link to={base} className={navLinkClass({ isActive: active })}>
              {variant.name}
            </Link>
            {active && realization?.steps ? (
              <FlowSteps base={base} steps={realization.steps} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function SidebarNav({ client }: { client: ClientEntry }) {
  const variantMatch = useMatch("/c/:clientId/x/:experimentId/:variantId/*");
  const mainMatch = useMatch("/c/:clientId/p/:pageId/*");
  const routeExpId = variantMatch?.params.experimentId;
  const routeVariantId = variantMatch?.params.variantId;
  const activeMainPageId = mainMatch?.params.pageId;

  return (
    <>
      <nav className="space-y-1">
        <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">Pages</p>
        {pageNodes(client).map((node) => (
          <div key={node.pageId}>
            {node.page ? (
              <NavLink end to={`/c/${client.id}/p/${node.pageId}`} className={navLinkClass}>
                {node.title}
              </NavLink>
            ) : (
              <p className="px-3 py-1.5 text-sm text-muted-foreground italic">{node.title}</p>
            )}
            {node.page?.steps && activeMainPageId === node.pageId ? (
              <FlowSteps base={`/c/${client.id}/p/${node.pageId}`} steps={node.page.steps} />
            ) : null}
            {node.experiments.map((exp) => (
              <VariantSwitch
                key={exp.id}
                clientId={client.id}
                exp={exp}
                isMain={node.page !== undefined}
                activeVariantId={routeExpId === exp.id ? routeVariantId : undefined}
              />
            ))}
          </div>
        ))}
      </nav>
      {client.errors.length > 0 ? (
        <div className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 p-3">
          <p className="mb-1 text-xs font-semibold text-destructive uppercase">Contract errors</p>
          {client.errors.map((error) => (
            <p key={error} className="mb-1 text-xs break-words text-foreground">
              {error}
            </p>
          ))}
        </div>
      ) : null}
    </>
  );
}
