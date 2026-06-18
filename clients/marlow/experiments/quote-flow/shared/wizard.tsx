/**
 * Shared input styling for the guided-quote flow's steps. The stepper and the
 * Back / Next chrome live in the shell's flow renderer (ADR-0010), not here —
 * the step files only carry their own fields.
 */
export const wizardInput =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";
