import type { PlayTest, TokenSet } from "@design/ui";
import type { ComponentType } from "react";

/** Sentinel theme id for the Design standard tokens ("::" cannot occur in filenames). */
export const DESIGN_STANDARD_THEME = "::design";

/**
 * A page is either a file (a leaf with a `component`) or a folder (a flow with
 * ordered `steps`) — never both (ADR-0010). A flow is one level deep: each step
 * is itself a leaf page. Exactly one of `component` / `steps` is set.
 */
export type PageEntry = {
  id: string;
  title: string;
  order: number;
  /** The component for a leaf page or a flow step; absent for a flow folder. */
  component?: ComponentType;
  /** Ordered steps when this page is a flow; absent for a leaf page. */
  steps?: PageEntry[];
  /** Named screen states (ADR-0011): a map of state id → render thunk. The
   *  default render is the implicit `default` state and is not listed here. */
  states?: Record<string, ComponentType>;
  /** Optional authored interaction check (ADR-0009, layer 3), run by the play runner. */
  play?: PlayTest;
  /** Experiments whose declared page node is this page (main pages only; empty
   *  for variant pages). Populated after experiments are discovered. */
  experiments: ExperimentEntry[];
};

/**
 * Themes are folder-scoped: global themes (repo-root `themes/`) apply to
 * every client, client-level everywhere in that client, experiment-level
 * only within that experiment, variant-level only within that variant. The
 * dock exposes exactly the themes of the current scope chain. `key` is
 * scope-qualified and unique.
 */
export type ThemeScope = "global" | "client" | "experiment" | "variant";

export type ThemeEntry = {
  key: string;
  id: string;
  scope: ThemeScope;
  /** Display context for experiment/variant themes ("Rebrand", "Quote flow · Wizard"). */
  ownerLabel?: string;
  tokens: TokenSet;
};

export type ExperimentStatus = "active" | "decided" | "archived";

export type VariantEntry = {
  id: string;
  name: string;
  pages: PageEntry[];
  themes: ThemeEntry[];
};

export type ExperimentEntry = {
  id: string;
  name: string;
  question?: string;
  status: ExperimentStatus;
  /** The page-tree node id this experiment explores (resolves to a Main page or
   *  a page introduced by this experiment's variants). */
  page: string;
  chosen?: string;
  /** Optional default theme id while viewing this experiment (own scope, then client scope). */
  theme?: string;
  themes: ThemeEntry[];
  /** Components in this experiment's shared/ — scoped to its variants. */
  components: ClientComponentEntry[];
  variants: VariantEntry[];
};

export type ClientComponentEntry = {
  id: string;
  /** Zero-prop preview exported as `demo`; absent components list name-only. */
  demo?: ComponentType;
  promoteCandidate: boolean;
};

export type ClientEntry = {
  id: string;
  name: string;
  description?: string;
  themes: ThemeEntry[];
  defaultTheme: string;
  pages: PageEntry[];
  components: ClientComponentEntry[];
  experiments: ExperimentEntry[];
  /** Contract violations collected during discovery; never fatal to other clients. */
  errors: string[];
};
