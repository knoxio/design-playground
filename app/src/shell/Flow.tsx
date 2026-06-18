import { Link, useNavigate } from "react-router";
import type { PageEntry } from "../registry/types";

/**
 * Renders a flow page (ADR-0010): a horizontal stepper plus the active step,
 * with Back / Next navigating between step routes as SPA transitions (no full
 * reload), so the comment overlay and viewport state survive across steps.
 */
export function Flow({
  flow,
  stepId,
  state,
  hrefForStep,
}: {
  flow: PageEntry;
  stepId: string;
  state?: string | null;
  hrefForStep: (stepId: string) => string;
}) {
  const navigate = useNavigate();
  const steps = flow.steps ?? [];
  const index = Math.max(
    0,
    steps.findIndex((s) => s.id === stepId),
  );
  const active = steps[index];
  const ActiveStep =
    active && state && active.states?.[state] ? active.states[state] : active?.component;
  if (!ActiveStep) return <p className="p-8 text-muted-foreground">Step not found.</p>;

  const prev = steps[index - 1];
  const next = steps[index + 1];

  return (
    <div className="flex h-full flex-col">
      <nav aria-label="Flow steps" className="flex items-center gap-2 border-b border-border p-4">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2">
            <Link
              to={hrefForStep(step.id)}
              aria-current={i === index ? "step" : undefined}
              className="flex items-center gap-2 text-sm"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  i === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span className={i === index ? "font-medium" : "text-muted-foreground"}>
                {step.title}
              </span>
            </Link>
            {i < steps.length - 1 ? <span className="text-muted-foreground">—</span> : null}
          </div>
        ))}
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ActiveStep />
      </div>
      <div className="flex justify-between border-t border-border p-4">
        <button
          type="button"
          disabled={!prev}
          onClick={prev ? () => void navigate(hrefForStep(prev.id)) : undefined}
          className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!next}
          onClick={next ? () => void navigate(hrefForStep(next.id)) : undefined}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
