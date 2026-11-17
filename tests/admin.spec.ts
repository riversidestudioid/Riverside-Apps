import { test, expect } from "@playwright/test";
test("unauthenticated admin access redirects to login without leaking editor", async ({
  page,
}) => {
  await page.goto("/admin/apps");
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { name: "Masuk Admin", level: 1 }),
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
test("pricing UI is gone and admin request pages and API stay protected without configuration", async ({
  page,
  request,
}) => {
  await page.goto("/apps");
  await expect(page.getByRole("combobox", { name: "Model akses" })).toHaveCount(
    0,
  );
  await page.goto("/apps?billing=monthly");
  await expect(
    page.getByRole("heading", { name: "Katalog sedang dipersiapkan" }),
  ).toBeVisible();
  for (const path of ["/admin/requests", "/admin/plans", "/admin/settings"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?status=setup/);
  }
  expect((await request.get("/api/admin/apps")).status()).toBe(401);
});
