import type { Anchor, Thread } from "./api";
import { parseAnchor } from "./api";

export type Target = { el: Element; anchor: Anchor };

function excerpt(el: Element): string {
  return (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
}

/**
 * A stable-enough CSS path for elements with no semantic anchor: nearest id
 * wins, otherwise tag:nth-of-type segments up to six levels. Paired with a
 * text excerpt so consumers can fall back to text search on DOM drift.
 */
function buildSelector(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.tagName !== "BODY" && parts.length < 6) {
    if (node.id) {
      parts.unshift(`#${node.id}`);
      return parts.join(" > ");
    }
    const tag = node.tagName.toLowerCase();
    const siblings = node.parentElement
      ? [...node.parentElement.children].filter((c) => c.tagName === node?.tagName)
      : [];
    parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${siblings.indexOf(node) + 1})` : tag);
    node = node.parentElement;
  }
  return parts.join(" > ");
}

function semanticTarget(el: Element): Target | null {
  const source = el.closest("[data-hx-source]");
  const sourceValue = source?.getAttribute("data-hx-source");
  if (source && sourceValue) {
    return {
      el: source,
      anchor: {
        kind: "source",
        source: sourceValue,
        tag: source.tagName.toLowerCase(),
        text: excerpt(source),
      },
    };
  }
  const token = el.closest("[data-hx-token]");
  const tokenValue = token?.getAttribute("data-hx-token");
  if (token && tokenValue) {
    return { el: token, anchor: { kind: "token", token: tokenValue, text: excerpt(token) } };
  }
  const kit = el.closest("[data-hx-kit]");
  const kitValue = kit?.getAttribute("data-hx-kit");
  if (kit && kitValue) {
    return { el: kit, anchor: { kind: "kit", component: kitValue, text: excerpt(kit) } };
  }
  return null;
}

/**
 * Best anchor for a point: source stamp, token row, or kit demo when one
 * contains it (precise, survives DOM churn), otherwise a selector anchor on
 * the element itself — which is all preview builds ever produce, since
 * stamps don't exist there.
 */
export function findTarget(x: number, y: number): Target | null {
  for (const el of document.elementsFromPoint(x, y)) {
    if (el.closest("[data-hx-ui]")) return null;
    const semantic = semanticTarget(el);
    if (semantic) return semantic;
    return { el, anchor: { kind: "selector", selector: buildSelector(el), text: excerpt(el) } };
  }
  return null;
}

/** The live element a stored thread points at on the current page, if any. */
export function resolveThread(thread: Thread): Element | null {
  const anchor = parseAnchor(thread);
  try {
    switch (anchor?.kind) {
      case "source":
        return document.querySelector(`[data-hx-source="${anchor.source}"]`);
      case "token":
        return document.querySelector(`[data-hx-token="${anchor.token}"]`);
      case "kit":
        return document.querySelector(`[data-hx-kit="${anchor.component}"]`);
      case "selector":
        return document.querySelector(anchor.selector);
      default:
        return null;
    }
  } catch {
    return null;
  }
}
