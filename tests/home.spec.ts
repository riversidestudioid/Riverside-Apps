import { test, expect } from "@playwright/test";

const noOverflow = () => document.documentElement.scrollWidth <= innerWidth;

for (const width of [375, 768, 1024, 1440]) {
  test(`home fits ${width}px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Aplikasi Sederhana, Manfaat Nyata.",
      }),
    ).toBeVisible();
    // Exactly two primary services, each with one action.
    const services = page.getByRole("region", { name: "Layanan utama" });
    await expect(
      services.getByRole("heading", { level: 2, name: "Jelajahi Aplikasi" }),
    ).toBeVisible();
    await expect(
      services.getByRole("heading", { level: 2, name: "Buat Aplikasi Custom" }),
    ).toBeVisible();
    await expect(services.getByRole("link")).toHaveCount(2);
    await expect(
      services.getByRole("link", { name: "Lihat aplikasi" }),
    ).toHaveAttribute("href", "/apps");
    await expect(
      services.getByRole("link", { name: "Pesan aplikasi" }),
    ).toHaveAttribute("href", "/custom");
    // Without published products there is no featured section and no repeated CTA banner.
    await expect(
      page.getByRole("heading", { name: "Aplikasi Pilihan" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Butuh Aplikasi Sesuai Kebutuhan?" }),
    ).toHaveCount(0);
    const [left, right] = await services.locator(".service-card").all();
    const a = (await left.boundingBox())!;
    const b = (await right.boundingBox())!;
    if (width >= 768) expect(Math.abs(a.y - b.y)).toBeLessThan(2);
    else expect(b.y).toBeGreaterThan(a.y + a.height - 1);
    expect(await page.evaluate(noOverflow)).toBe(true);
    await page.screenshot({
      path: `artifacts/home-${width}.png`,
      fullPage: true,
    });
  });
}

test("header is logo, Aplikasi and Custom; admin login stays reachable from the footer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const header = page.locator(".site-header");
  const nav = page.getByRole("navigation", { name: "Navigasi utama" });
  await expect(nav.getByRole("link")).toHaveText(["Aplikasi", "Custom"]);
  await expect(
    header.getByRole("link", { name: /Riverside Apps/ }),
  ).toHaveAttribute("href", "/");
  await expect(header.getByRole("button")).toHaveCount(0);
  for (const hidden of ["Beranda", "Masuk", "Harga", "Daftar", "Buat Akun"])
    await expect(header.getByRole("link", { name: hidden })).toHaveCount(0);
  await expect(
    page.locator(".site-footer").getByRole("link", { name: "Admin" }),
  ).toHaveAttribute("href", "/login");
  await expect(page.getByText(/Rp\s*\d/)).toHaveCount(0);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /aplikasi custom/,
  );
  await page.goto("/apps");
  await expect(nav.getByRole("link", { name: "Aplikasi" })).toHaveAttribute(
    "aria-current",
    "page",
  );
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

test("mobile header links navigate to the custom form, which is disabled without a database", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");
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
