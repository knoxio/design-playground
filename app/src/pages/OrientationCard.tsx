import { ArrowRight, X } from "@helix/ui/icons";
import { useState } from "react";

const ORIENTED_KEY = "hx-oriented";

const concepts = [
  ["Client", "one folder, one engagement — brief, themes, pages, experiments, mock data"],
  [
    "Theme",
    "a YAML token set; the dock swaps them live, scoped global → client → experiment → variant",
  ],
  ["Experiment", "a question the client hasn't answered yet; it lives in the sidebar"],
  ["Variant", "a competing answer; flip between them on the bottom dock while screen-sharing"],
];

const flow = ["Describe the change", "PR opens", "Checks pass", "Merged + previews update"];

/**
 * First-session orientation for the designer driving the playground — shown
 * until dismissed, reopenable from the footer. The trigger for building it:
 * the first solo session should not need a human guide.
 */
export function OrientationCard() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(ORIENTED_KEY) === "yes");

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => {
          localStorage.removeItem(ORIENTED_KEY);
          setDismissed(false);
        }}
        className="mb-6 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        How this works →
      </button>
    );
  }

  return (
    <div className="relative mb-8 rounded-lg border border-border bg-surface p-5">
      <button
        type="button"
        aria-label="Dismiss guide"
        onClick={() => {
          localStorage.setItem(ORIENTED_KEY, "yes");
          setDismissed(true);
        }}
        className="absolute top-3 right-3 text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <h2 className="mb-3 text-sm font-semibold">How this works</h2>
      <dl className="mb-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {concepts.map(([term, definition]) => (
          <div key={term} className="text-xs">
            <dt className="inline font-medium">{term}</dt>
            <dd className="inline text-muted-foreground"> — {definition}</dd>
          </div>
        ))}
      </dl>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {flow.map((step, i) => (
          <span key={step} className="flex items-center gap-1.5">
            <span className="rounded-md border border-border bg-muted px-2 py-1 text-xs">
              {step}
            </span>
            {i < flow.length - 1 ? <ArrowRight className="h-3 w-3 text-muted-foreground" /> : null}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Everything happens by describing changes in your session — nothing here needs manual
        registration. Press{" "}
        <span className="rounded-sm border border-border bg-muted px-1 font-mono">i</span> inside a
        client to comment on any element or a whole page — clients see and reply to the same threads
        on their previews. The dock at the bottom switches themes, variants, and simulated screen
        sizes.
      </p>
    </div>
  );
}
