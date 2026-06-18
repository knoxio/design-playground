import { expect, test } from "@playwright/test";

/**
 * The internal app: the surface Mary works in. Boot, navigate to a client,
 * and exercise the dock tools and comment mode that unit tests can't reach.
 */

test("overview lists clients and links into one", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Design/ })).toBeVisible();
  await page.getByRole("link", { name: /Marlow Freight/ }).click();
  await expect(page).toHaveURL(/\/c\/marlow\/p\//);
});

test("a client page shows the sidebar and the dock tools", async ({ page }) => {
  await page.goto("/c/marlow/p/home");
  await expect(page.getByRole("link", { name: "Tokens" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Comments (i)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch theme" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Simulated screen size" })).toBeVisible();
});

test("the viewport tool opens its presets", async ({ page }) => {
  await page.goto("/c/marlow/p/home");
  await page.getByRole("button", { name: "Simulated screen size" }).click();
  await expect(page.getByText("Phone", { exact: true })).toBeVisible();
  await expect(page.getByText("Tablet", { exact: true })).toBeVisible();
});

test("comment mode toggles on", async ({ page }) => {
  await page.goto("/c/marlow/p/home");
  await page.getByRole("button", { name: "Comments (i)" }).click();
  await expect(page.getByRole("button", { name: "Exit comments (Esc)" })).toBeVisible();
});

test("the theme tool opens and lists scoped themes", async ({ page }) => {
  await page.goto("/c/marlow/p/home");
  await page.getByRole("button", { name: "Switch theme" }).click();
  await expect(page.getByText(/themes/i).first()).toBeVisible();
});

test("the sidebar nests an experiment's variants under its page", async ({ page }) => {
  await page.goto("/c/marlow/p/home");
  await expect(page.getByText("Quote flow", { exact: true })).toBeVisible();
  const wizard = page.getByRole("link", { name: "Guided wizard", exact: true });
  await expect(wizard).toBeVisible();
  await wizard.click();
  // banksia realizes new-quote as a flow, so it lands on the first step
  await expect(page).toHaveURL(/\/c\/marlow\/x\/quote-flow\/banksia\/new-quote\/lane$/);
});

test("switching a variant keeps the current page", async ({ page }) => {
  await page.goto("/c/marlow/x/quote-flow/banksia/new-quote");
  await page.getByRole("link", { name: "Dense form", exact: true }).click();
  await expect(page).toHaveURL(/\/c\/marlow\/x\/quote-flow\/juniper\/new-quote$/);
});

test("a flow lands on step 1 and the stepper navigates without a full reload", async ({ page }) => {
  let loads = 0;
  page.on("load", () => {
    loads += 1;
  });
  await page.goto("/c/marlow/x/quote-flow/banksia/new-quote");
  await expect(page).toHaveURL(/\/x\/quote-flow\/banksia\/new-quote\/lane$/);
  const afterLanding = loads;

  const stepper = page.getByRole("navigation", { name: "Flow steps" });
  await stepper.getByRole("link", { name: "Schedule" }).click();
  await expect(page).toHaveURL(/\/new-quote\/schedule$/);
  await expect(page.getByText("When should it move?")).toBeVisible();
  expect(loads).toBe(afterLanding);
});

test("switching a flow variant to a non-flow variant keeps the page, drops the step", async ({
  page,
}) => {
  await page.goto("/c/marlow/x/quote-flow/banksia/new-quote/freight");
  await page.getByRole("link", { name: "Dense form", exact: true }).click();
  await expect(page).toHaveURL(/\/c\/marlow\/x\/quote-flow\/juniper\/new-quote$/);
  await expect(page.getByText("Everything on one screen")).toBeVisible();
});

test("the dock variant switcher stays available inside a flow", async ({ page }) => {
  await page.goto("/c/marlow/x/quote-flow/banksia/new-quote/freight");
  await expect(page.getByRole("button", { name: /Quote flow · Guided wizard/ })).toBeVisible();
});

test("the state switcher flips the render and deep-links via ?state=", async ({ page }) => {
  await page.goto("/c/marlow/p/quotes");
  await page.getByRole("button", { name: "Switch state" }).click();
  await page.getByRole("button", { name: "empty", exact: true }).click();
  await expect(page).toHaveURL(/\/c\/marlow\/p\/quotes\?state=empty$/);
  await expect(page.getByText("No quotes yet", { exact: false })).toBeVisible();
});

test("deep-linking a state renders it directly", async ({ page }) => {
  await page.goto("/c/marlow/p/quotes?state=error");
  await expect(page.getByText(/carrier pricing API timed out/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch state" })).toBeVisible();
});
