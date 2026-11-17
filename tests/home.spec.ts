import { test, expect } from "@playwright/test";

const noOverflow = () => document.documentElement.scrollWidth <= innerWidth;

for (const width of [375, 768, 1024, 1440]) {
  test(`home fits ${width}px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Solusi Aplikasi & Web App untuk Kebutuhanmu.",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Jelajahi Aplikasi" }),
    ).toHaveAttribute("href", "/apps");
    await expect(
      page.getByRole("link", { name: "Pesan Aplikasi Custom" }).first(),
    ).toHaveAttribute("href", "/custom");
    await expect(
      page.getByRole("heading", { name: "Aplikasi Pilihan" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Butuh Aplikasi Sesuai Kebutuhan?" }),
    ).toBeVisible();
    expect(await page.evaluate(noOverflow)).toBe(true);
    await page.screenshot({
      path: `artifacts/home-${width}.png`,
      fullPage: true,
    });
  });
}

test("header has only Beranda, Aplikasi, Custom and admin login; legacy routes redirect", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Navigasi utama" });
  await expect(nav.getByRole("link", { name: "Beranda" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  for (const hidden of ["Harga", "Daftar", "Buat Akun"])
    await expect(page.getByRole("link", { name: hidden })).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Masuk", exact: true }),
  ).toHaveAttribute("href", "/login");
  await expect(page.getByText(/Rp\s*\d/)).toHaveCount(0);
  await page.goto("/harga");
  await expect(page).toHaveURL(/\/apps$/);
  await page.goto("/register");
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/privacy");
  await expect(
    page.getByRole("heading", { name: "Kebijakan Privasi", level: 1 }),
  ).toBeVisible();
  await page.goto("/tidak-ada-halaman");
  await expect(
    page.getByRole("heading", { name: "Halaman tidak ditemukan" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Navigasi utama" }),
  ).toBeVisible();
});

test("unconfigured catalog is empty, keeps shareable search and supports shortcut", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".app-card")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Aplikasi segera hadir" }),
  ).toBeVisible();
  await page.goto("/apps");
  await expect(
    page.getByRole("heading", { name: "Katalog sedang dipersiapkan" }),
  ).toBeVisible();
  await page
    .getByRole("searchbox", { name: "Cari aplikasi", exact: true })
    .fill("sertifikat");
  await page.getByRole("button", { name: "Cari", exact: true }).click();
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
    page.getByRole("searchbox", { name: "Cari aplikasi", exact: true }),
  ).toBeFocused();
});

test("mobile menu navigates to the custom form, which is disabled without a database", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Buka menu" }).click();
  await page
    .getByRole("navigation", { name: "Navigasi utama" })
    .getByRole("link", { name: "Custom", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pesan Aplikasi Custom", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Formulir belum aktif")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Kirim Permintaan" }),
  ).toBeDisabled();
  expect(await page.evaluate(noOverflow)).toBe(true);
  await page.screenshot({ path: "artifacts/custom-375.png", fullPage: true });
});
