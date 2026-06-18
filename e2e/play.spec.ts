import { expect, test } from "@playwright/test";

/**
 * Layer 3 — page play-tests (ADR-0009). Each page may export a `play` test; the
 * internal app registers them on `window.hxPlay` keyed by canonical address.
 * This runner enumerates them, navigates to each address, and runs the play
 * against the live canvas — so a broken interaction fails CI next to the page.
 */

type PlayResult = { ok: boolean; error?: string };

declare global {
  interface Window {
    hxPlay?: Record<string, { name: string; run: () => Promise<PlayResult> }>;
  }
}

async function waitForCanvas(page: import("@playwright/test").Page): Promise<void> {
  await page.waitForFunction(() => Boolean(window.hxPlay));
  await page.waitForFunction(() => {
    const canvas = document.querySelector("[data-dp-canvas]");
    return Boolean(canvas?.textContent?.trim());
  });
}

test("authored page play-tests pass", async ({ page }) => {
  await page.goto("/c/marlow/p/home");
  await page.waitForFunction(() => Boolean(window.hxPlay));
  const addresses = await page.evaluate(() => Object.keys(window.hxPlay ?? {}));
  expect(addresses.length).toBeGreaterThan(0);

  for (const address of addresses) {
    await page.goto(address);
    await waitForCanvas(page);
    const result = await page.evaluate(
      (a) => window.hxPlay?.[a]?.run() ?? { ok: false, error: "not registered" },
      address,
    );
    expect(result.ok, `${address}: ${result.error ?? ""}`).toBe(true);
  }
});
