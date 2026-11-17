import { test, expect } from "@playwright/test";
for (const width of [375, 768, 1024, 1440]) {
  test(`home fits ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "Semua", exact: true }),
    ).toBeEnabled();
    await page.screenshot({
      path: `artifacts/home-${width}.png`,
      fullPage: true,
    });
  });
}
test("unconfigured catalog is empty, preserves shared search and supports shortcut", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".product-card")).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Cari aplikasi", exact: true })
    .fill("sertifikat");
  await page.getByRole("button", { name: "Jalankan pencarian" }).click();
  await expect(page).toHaveURL(/q=sertifikat/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Tidak ada aplikasi yang cocok" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hapus pencarian" }).click();
  await expect(page).not.toHaveURL(/q=/);
  await page.locator("h1").click();
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("textbox", { name: "Cari aplikasi", exact: true }),
  ).toBeFocused();
});
test("mobile menu navigates", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Buka menu" }).click();
  await page
    .getByRole("navigation", { name: "Navigasi utama" })
    .getByRole("link", { name: "Custom", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Mari Wujudkan Aplikasi Anda" }),
  ).toBeVisible();
});
