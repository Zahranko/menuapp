import { expect, test } from "@playwright/test";

test("the sample site shows every section and works on this screen size", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto("/vanillamenu");
  await expect(page).toHaveTitle(/Vanilla Menu/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Coffee worth crossing the city for.");
  for (const id of ["signature", "menu", "story", "gallery", "reviews", "visit"]) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }

  // Sold-out products stay on the menu with a label.
  const mocha = page.locator("#menu-list li", { hasText: "Iced mocha" });
  await expect(mocha).toContainText("Sold out");

  // Search filters the menu.
  await page.getByRole("searchbox", { name: "Search the menu" }).fill("kunafa");
  await expect(page.locator("#menu-list li:visible")).toHaveCount(1);
  await page.getByRole("searchbox", { name: "Search the menu" }).fill("");

  // A product opens its details and closes again.
  await page.locator("#menu-list").getByRole("button", { name: /Karak chai/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Karak chai");
  await expect(dialog).toContainText("2.50 JD");
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();

  // Mobile uses the drawer, desktop shows the links.
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.locator("#site-drawer").getByRole("link", { name: "Visit us" }).click();
    await expect(page.locator("#site-drawer")).toBeHidden();
  } else {
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  }

  // Nothing is wider than the screen.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  // Structured data is valid JSON with prices.
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
  expect(ld["@type"]).toBe("CafeOrCoffeeShop");
  expect(ld.hasMenu.hasMenuSection[0].hasMenuItem[0].offers.price).toBe("3.50");

  await page.screenshot({ path: `test-results/souq-${info.project.name}.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test("unknown sites and previews are not found", async ({ page }) => {
  expect((await page.goto("/nosuchsite"))?.status()).toBe(404);
  expect((await page.goto("/_preview/expired"))?.status()).toBe(404);
});
