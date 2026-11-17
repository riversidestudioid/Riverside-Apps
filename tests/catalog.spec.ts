import { test, expect } from "@playwright/test";
// Dedicated local test database, isolated from the user's dev server/environment.
test.describe.configure({ mode: "serial" });
let apiUrl = "";
const noOverflow = () => document.documentElement.scrollWidth <= innerWidth;

test.beforeEach(async ({ page }) => {
  await page.route("**/*youtube-nocookie.com/**", (route) => route.abort());
});
test.beforeAll(async ({ browser, baseURL }) => {
  const page = await browser.newPage({ baseURL });
  await page.route("**/*youtube-nocookie.com/**", (route) => route.abort());
  try {
    await discoverApi(page);
  } finally {
    await page.close();
  }
});
// The API base is discovered from a public image redirect; no test-only app routes are installed.
async function discoverApi(page: import("@playwright/test").Page) {
  await page.goto("/apps/alat-sertifikat-uji");
  const path = await page.locator(".detail-icon img").getAttribute("src");
  const response = await page.request.get(path!, { maxRedirects: 0 });
  const location = response.headers().location;
  expect(location).toBeTruthy();
  apiUrl = new URL(location).origin;
}

test("featured homepage, catalog grid and detail come from the database without prices", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".app-card")).toHaveCount(1);
  await expect(page.locator(".app-card")).toContainText("Alat Sertifikat Uji");
  await expect(page.locator(".app-card")).toContainText("Pendidikan");
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(noOverflow)).toBe(true);
    await page.screenshot({
      path: `artifacts/home-database-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/apps");
  await expect(page.locator(".app-card")).toHaveCount(2);
  await expect(page.getByText("2 aplikasi ditemukan")).toBeVisible();
  await expect(page.getByText("Nama Draft Rahasia")).toHaveCount(0);
  await expect(page.getByText(/Rp\s*\d/)).toHaveCount(0);
  await page.screenshot({ path: "artifacts/apps-1280.png", fullPage: true });
  await page
    .getByRole("link", { name: "Lihat detail Alat Sertifikat Uji" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Alat Sertifikat Uji", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Fitur Utama" }),
  ).toBeVisible();
  await expect(page.getByText("Ekspor PDF", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Screenshot" })).toBeVisible();
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  );
  const launch = page.getByRole("link", { name: "Buka Aplikasi" });
  await expect(launch).toHaveAttribute("href", "https://example.com/app");
  await expect(launch).toHaveAttribute("rel", "noopener noreferrer");
  await expect(launch).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("link", { name: "Coba Demo" })).toHaveAttribute(
    "href",
    "https://example.com/demo",
  );
  // Plans still exist in the database but are never rendered publicly.
  await expect(page.getByText(/Rp\s*\d/)).toHaveCount(0);
  await expect(page.getByText("Pilihan Harga")).toHaveCount(0);
  await page.screenshot({ path: "artifacts/detail-1280.png", fullPage: true });
  await page.setViewportSize({ width: 375, height: 900 });
  expect(await page.evaluate(noOverflow)).toBe(true);
  await page.screenshot({ path: "artifacts/detail-375.png", fullPage: true });
});

test("server search, category filter, sort and shareable URLs", async ({
  page,
}) => {
  await page.goto("/apps");
  await page
    .getByRole("searchbox", { name: "Cari aplikasi", exact: true })
    .fill("RAHASIA-KATALOG");
  await page.getByRole("button", { name: "Cari", exact: true }).click();
  await expect(page).toHaveURL(/q=RAHASIA-KATALOG/);
  await expect(page.locator(".app-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".app-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Hapus pencarian" }).click();
  await expect(page.locator(".app-card")).toHaveCount(2);
  await page
    .getByRole("group", { name: "Filter kategori" })
    .getByRole("button", { name: "Bisnis", exact: true })
    .click();
  await expect(page).toHaveURL(/category=bisnis/);
  await expect(page.locator(".app-card")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Bisnis", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/kategori/bisnis?sort=newest");
  await expect(page).toHaveURL(/\/apps\?category=bisnis&sort=newest/);
  await expect(page.locator(".app-card")).toHaveCount(1);
  await expect(page.locator(".app-card")).toContainText("Bisnis Uji");
  await page.goto("/apps?sort=newest");
  await expect(page.locator(".app-card").first()).toContainText("Bisnis Uji");
  await page.goto("/apps?sort=name");
  await expect(page.locator(".app-card").first()).toContainText(
    "Alat Sertifikat Uji",
  );
  await page.goto("/apps?q=tidak-ada-yang-cocok");
  await page.getByRole("button", { name: "Hapus filter" }).click();
  await expect(page.locator(".app-card")).toHaveCount(2);
});

test("draft and archived direct slugs render not-found without leaking data", async ({
  page,
}) => {
  for (const slug of ["produk-draft-uji", "produk-arsip-uji", "tidak-ada"]) {
    await page.goto("/apps/" + slug);
    await expect(
      page.getByRole("heading", { name: "Halaman tidak ditemukan" }),
    ).toBeVisible();
    await expect(page.getByText("Nama Draft Rahasia")).toHaveCount(0);
    await expect(page.getByText("Nama Arsip Rahasia")).toHaveCount(0);
  }
});

test("custom requests are not readable through the public API", async ({
  request,
}) => {
  const response = await request.get(apiUrl + "/rest/v1/custom_requests", {
    headers: { apikey: "test-only-publishable-key" },
  });
  expect(response.status()).toBe(403);
});

test("database error is visible, can retry and cannot expose internal details", async ({
  page,
  request,
}) => {
  expect(apiUrl).toBeTruthy();
  await request.post(apiUrl + "/__test/failure?enabled=1");
  await page.goto("/apps");
  await expect(
    page.getByRole("heading", { name: "Halaman belum dapat dimuat" }),
  ).toBeVisible();
  await expect(
    page.getByText("Internal test database unavailable"),
  ).toHaveCount(0);
  await request.post(apiUrl + "/__test/failure?enabled=0");
  await page.getByRole("button", { name: "Coba Lagi" }).click();
  await expect(page.locator(".app-card")).toHaveCount(2);
});

test("empty published database shows professional states rather than fallback products", async ({
  page,
  request,
}) => {
  await request.post(apiUrl + "/__test/empty");
  await page.goto("/apps");
  await expect(
    page.getByRole("heading", { name: "Katalog sedang dipersiapkan" }),
  ).toBeVisible();
  await expect(page.locator(".app-card")).toHaveCount(0);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Aplikasi segera hadir" }),
  ).toBeVisible();
  await page.goto("/apps/alat-sertifikat-uji");
  await expect(
    page.getByRole("heading", { name: "Halaman tidak ditemukan" }),
  ).toBeVisible();
  await request.post(apiUrl + "/__test/reset");
});
