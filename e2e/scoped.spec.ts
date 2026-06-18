import { expect, test } from "@playwright/test";

/**
 * The scoped client preview (VITE_CLIENT): the surface a client opens. It
 * boots straight into the client's first page and shows the floating client
 * toolbar — comments and viewport simulation plus the prototype disclaimer —
 * but never the internal dock's theme/variant switching, so a client can't
 * reskin the prototype or pick variants. Served on 3010.
 */

test.use({ baseURL: "http://localhost:3010" });

test("boots straight into the client's first page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/c\/marlow\/p\//);
});

test("shows the prototype disclaimer, comment toggle, and viewport tool", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Prototype — sample data/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Comments (i)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Simulated screen size" })).toBeVisible();
});

test("does not expose theme or variant switching", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Switch theme" })).toHaveCount(0);
});

test("comment mode toggles on", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Comments (i)" }).click();
  await expect(page.getByRole("button", { name: "Exit comments (Esc)" })).toBeVisible();
});
