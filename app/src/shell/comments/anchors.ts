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
  const source = el.closest("[data-dp-source]");
  const sourceValue = source?.getAttribute("data-dp-source");
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
  const token = el.closest("[data-dp-token]");
  const tokenValue = token?.getAttribute("data-dp-token");
  if (token && tokenValue) {
    return { el: token, anchor: { kind: "token", token: tokenValue, text: excerpt(token) } };
  }
  const kit = el.closest("[data-dp-kit]");
  const kitValue = kit?.getAttribute("data-dp-kit");
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
    if (el.closest("[data-dp-ui]")) return null;
    const semantic = semanticTarget(el);
    if (semantic) return semantic;
    return { el, anchor: { kind: "selector", selector: buildSelector(el), text: excerpt(el) } };
  }
  return null;
}

/**
 * Pick one element for a stored selector. A repeated component shares one
 * `data-dp-source` line across every instance, so a bare querySelector collapses
 * them onto the first — every comment on a list row would stack on row one. When
 * several match, prefer the instance whose text excerpt matches the one captured
 * at comment time, so each thread resolves to its own row.
 */
function pick(selector: string, text?: string): Element | null {
  let els: Element[];
  try {
    els = [...document.querySelectorAll(selector)];
  } catch {
    return null;
  }
  if (els.length <= 1) return els[0] ?? null;
  if (text) return els.find((el) => excerpt(el) === text) ?? els[0] ?? null;
  return els[0] ?? null;
}

/** The live element a stored thread points at on the current page, if any. */
export function resolveThread(thread: Thread): Element | null {
  const anchor = parseAnchor(thread);
  switch (anchor?.kind) {
    case "source":
      return pick(`[data-dp-source="${anchor.source}"]`, anchor.text);
    case "token":
      return pick(`[data-dp-token="${anchor.token}"]`, anchor.text);
    case "kit":
      return pick(`[data-dp-kit="${anchor.component}"]`, anchor.text);
    case "selector":
      return pick(anchor.selector, anchor.text);
    default:
      return null;
  }
}
