import type { PlayContext, PlayElement } from "@design/ui";

/**
 * A DOM-backed implementation of the neutral `PlayContext`. Play-tests are
 * authored against the abstract context (no test framework in client code); the
 * in-app and Playwright-driven runners both execute them through this adapter,
 * scoped to the rendered page canvas.
 */

const ROLE_SELECTORS: Record<string, string> = {
  heading: "h1,h2,h3,h4,h5,h6,[role=heading]",
  button: "button,[role=button]",
  link: "a[href],[role=link]",
  table: "table,[role=table]",
  textbox: "input,textarea,[role=textbox]",
};

function isVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return true;
  return el.offsetParent !== null || getComputedStyle(el).position === "fixed";
}

function accessibleName(el: Element): string {
  return (el.getAttribute("aria-label") ?? el.textContent ?? "").trim();
}

function element(el: Element | null, label: string): PlayElement {
  const require = () => {
    if (!el) throw new Error(`play: ${label} not found`);
    return el;
  };
  return {
    click: async () => {
      const node = require();
      if (node instanceof HTMLElement) node.click();
    },
    expectVisible: async () => {
      const node = require();
      if (!isVisible(node)) throw new Error(`play: ${label} is not visible`);
    },
    expectText: async (text) => {
      const node = require();
      if (!(node.textContent ?? "").includes(text)) {
        throw new Error(`play: ${label} does not contain text "${text}"`);
      }
    },
  };
}

export function createPlayContext(root: ParentNode): PlayContext {
  return {
    getByText: (text) => {
      const match = [...root.querySelectorAll<HTMLElement>("*")]
        .toReversed()
        .find((el) => (el.textContent ?? "").includes(text) && isVisible(el));
      return element(match ?? null, `text "${text}"`);
    },
    getByRole: (role, options) => {
      const selector = ROLE_SELECTORS[role] ?? `[role=${role}]`;
      const candidates = [...root.querySelectorAll(selector)].filter(isVisible);
      const name = options?.name;
      const match = name
        ? candidates.find((el) => accessibleName(el).includes(name))
        : candidates[0];
      return element(match ?? null, name ? `${role} "${name}"` : role);
    },
  };
}
