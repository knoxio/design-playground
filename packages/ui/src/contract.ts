/**
 * Colocated page metadata — every `clients/<id>/pages/<page-id>.tsx` exports
 * `meta: PageMeta` alongside its default component export. See
 * docs/reference/client-folder-contract.md.
 */
export type PageMeta = {
  title: string;
  order?: number;
  /**
   * Flow steps only: set `false` on a step to drop the flow's bottom Back/Next
   * bar (the top stepper still navigates). Use when the page provides its own
   * stage navigation, so the app chrome would be redundant. A flow hides the bar
   * if any of its steps opts out. Defaults to showing it.
   */
  flowButtons?: boolean;
};

/**
 * A page "play-test" (ADR-0009, layer 3): an authored interaction check that
 * runs against the rendered page. It is written against the neutral
 * `PlayContext` — never importing a test framework into client code — so the
 * same `play` export runs under a Playwright runner and the in-app runner.
 */
export type PlayElement = {
  click: () => Promise<void>;
  expectVisible: () => Promise<void>;
  expectText: (text: string) => Promise<void>;
};

export type PlayContext = {
  /** Find an element by visible text within the page canvas. */
  getByText: (text: string) => PlayElement;
  /** Find an element by ARIA role, optionally by accessible name. */
  getByRole: (role: string, options?: { name?: string }) => PlayElement;
};

export type PlayTest = (ctx: PlayContext) => void | Promise<void>;
