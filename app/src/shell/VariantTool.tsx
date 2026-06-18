import { Link, useMatch, useSearchParams } from "react-router";
import type { ClientEntry, ExperimentEntry, VariantEntry } from "../registry/types";
import { buildAddress, preserveCoordinates } from "./address";
import { Chevron } from "./Chevron";
import { glass, panel } from "./glass";
import { capabilitiesFor } from "./surface";

type DockOption = {
  key: string;
  label: string;
  to?: string;
  isCurrent: boolean;
  chosen?: boolean;
  disabledNote?: string;
};

type Current = { pageId: string; stepId?: string; state?: string };

function variantTarget(client: ClientEntry, variant: VariantEntry, pageId: string): string {
  const reachable =
    variant.pages.some((p) => p.id === pageId) || client.pages.some((p) => p.id === pageId);
  return reachable ? pageId : (variant.pages[0]?.id ?? pageId);
}

/** A variant's address for the current surface, preserving step/state where the
 *  target realizes them (ADR-0013), dropping to the nearest valid parent otherwise. */
function variantAddress(
  client: ClientEntry,
  experiment: ExperimentEntry,
  variant: VariantEntry,
  current: Current,
): string {
  const pageId = variantTarget(client, variant, current.pageId);
  const caps = capabilitiesFor(client, experiment.id, variant.id, pageId);
  return buildAddress(
    preserveCoordinates(
      {
        clientId: client.id,
        experimentId: experiment.id,
        variantId: variant.id,
        pageId,
        stepId: current.stepId,
        state: current.state,
      },
      caps,
    ),
  );
}

/**
 * Main's address for the current page: the same page when Main has it, else the
 * nearest main page this variant overrides — preserving step/state best-effort.
 * Null when the page only exists inside the variant, so Main shows disabled
 * instead of teleporting somewhere unrelated.
 */
function mainAddress(
  client: ClientEntry,
  variant: VariantEntry | undefined,
  current: Current,
): string | null {
  let pageId: string | null = null;
  if (client.pages.some((p) => p.id === current.pageId)) pageId = current.pageId;
  else pageId = variant?.pages.find((vp) => client.pages.some((p) => p.id === vp.id))?.id ?? null;
  if (!pageId) return null;
  const caps = capabilitiesFor(client, undefined, undefined, pageId);
  return buildAddress(
    preserveCoordinates(
      { clientId: client.id, pageId, stepId: current.stepId, state: current.state },
      caps,
    ),
  );
}

type VariantContext = {
  currentExperiment?: ExperimentEntry;
  currentVariant?: VariantEntry;
  groups: { experiment: ExperimentEntry; options: DockOption[] }[];
  mainOption: DockOption;
};

function buildVariantContext(
  client: ClientEntry,
  current: Current | null,
  active: { experimentId?: string; variantId?: string } | undefined,
): VariantContext | null {
  if (!current) return null;

  const activeExperiments = client.experiments.filter((e) => e.status === "active");
  const currentExperiment = active
    ? activeExperiments.find((e) => e.id === active.experimentId)
    : undefined;
  const currentVariant = currentExperiment?.variants.find((v) => v.id === active?.variantId);

  const relevantExperiments = active
    ? currentExperiment
      ? [currentExperiment]
      : []
    : activeExperiments.filter((e) =>
        e.variants.some((v) => v.pages.some((p) => p.id === current.pageId)),
      );
  if (relevantExperiments.length === 0) return null;

  const groups = relevantExperiments.map((experiment) => ({
    experiment,
    options: experiment.variants.map((variant) => ({
      key: `${experiment.id}/${variant.id}`,
      label: variant.name,
      to: variantAddress(client, experiment, variant, current),
      isCurrent: currentVariant ? variant.id === currentVariant.id : false,
      chosen: experiment.chosen === variant.id,
    })),
  }));
  const mainTo = mainAddress(client, currentVariant, current);
  const mainOption: DockOption = {
    key: "main",
    label: "Main",
    to: mainTo ?? undefined,
    isCurrent: !active,
    disabledNote: mainTo ? undefined : "this page only exists in this variant",
  };
  return { currentExperiment, currentVariant, groups, mainOption };
}

export function VariantTool({
  client,
  isOpen,
  onToggle,
  onNavigate,
}: {
  client: ClientEntry;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const variantMatch = useMatch("/c/:clientId/x/:experimentId/:variantId/*");
  const mainMatch = useMatch("/c/:clientId/p/*");
  const [searchParams] = useSearchParams();

  const rest = variantMatch?.params["*"] ?? mainMatch?.params["*"];
  const [pageId, stepId] = (rest ?? "").split("/");
  const current: Current | null = pageId
    ? { pageId, stepId: stepId || undefined, state: searchParams.get("state") ?? undefined }
    : null;
  const active = variantMatch
    ? { experimentId: variantMatch.params.experimentId, variantId: variantMatch.params.variantId }
    : undefined;
  const context = buildVariantContext(client, current, active);
  if (!context) return null;
  const { currentExperiment, currentVariant, groups, mainOption } = context;

  const currentLabel = currentVariant
    ? `${currentExperiment?.name} · ${currentVariant.name}`
    : "Main";

  return (
    <div className="relative">
      {isOpen ? (
        <div className={`left-1/2 w-64 -translate-x-1/2 ${panel}`}>
          <DockItem option={mainOption} onNavigate={onNavigate} />
          {groups.map(({ experiment, options }) => (
            <div key={experiment.id}>
              <p className="px-2 pt-2 pb-1 text-xs font-semibold text-muted-foreground uppercase">
                {experiment.name}
              </p>
              {options.map((option) => (
                <DockItem key={option.key} option={option} onNavigate={onNavigate} />
              ))}
            </div>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className={`relative z-20 rounded-full px-4 py-2 text-sm font-medium text-foreground transition-all duration-150 hover:scale-[1.03] hover:bg-background/90 active:scale-95 ${glass}`}
      >
        <span className="inline-flex items-center gap-1.5">
          {currentLabel}
          <Chevron
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "" : "rotate-180"}`}
          />
        </span>
      </button>
    </div>
  );
}

function DockItem({ option, onNavigate }: { option: DockOption; onNavigate: () => void }) {
  if (!option.to) {
    return (
      <div className="flex items-center justify-between rounded-xl px-2 py-1.5 text-sm text-muted-foreground/60">
        <span className="truncate">{option.label}</span>
        <span className="ml-2 shrink-0 text-xs">{option.disabledNote}</span>
      </div>
    );
  }
  return (
    <Link
      to={option.to}
      onClick={onNavigate}
      className={`flex items-center justify-between rounded-xl px-2 py-1.5 text-sm transition-colors duration-150 ${
        option.isCurrent
          ? "bg-accent font-medium text-accent-foreground"
          : "text-foreground hover:bg-muted"
      }`}
    >
      <span className="truncate">{option.label}</span>
      <span className="ml-2 shrink-0 text-xs text-muted-foreground">
        {option.chosen ? "chosen ✓" : option.isCurrent ? "●" : ""}
      </span>
    </Link>
  );
}
