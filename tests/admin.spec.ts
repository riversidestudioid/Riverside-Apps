import { test, expect } from "@playwright/test";
test("unauthenticated admin access redirects to login without leaking editor", async ({
  page,
}) => {
  await page.goto("/admin/apps");
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { name: "Masuk ke Dashboard Admin" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Masuk sebagai Admin" }),
  ).toBeDisabled();
  await expect(
    page.getByText("Koneksi Supabase belum dikonfigurasi."),
  ).toBeVisible();
});
test("unconfigured login fits mobile and media endpoints do not expose assets", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/login");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  expect((await request.get("/media/invalid?preview=1")).status()).toBe(404);
  expect(
    (await request.get("/media/11111111-1111-4111-8111-111111111111")).status(),
  ).toBe(404);
});
test("pricing filter persists in URL and can clear to empty state", async ({
  page,
}) => {
  await page.goto("/apps");
  await page
    .getByRole("combobox", { name: "Model akses", exact: true })
    .selectOption("monthly");
  await expect(page).toHaveURL(/billing=monthly/);
  await expect(
    page.getByRole("heading", { name: "Tidak ada aplikasi yang cocok" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Model akses", exact: true }),
  ).toHaveValue("monthly");
  await page.getByRole("button", { name: "Hapus filter", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(0);
});
