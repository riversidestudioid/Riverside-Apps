import { test, expect } from "@playwright/test";
// Dedicated local test database, isolated from the user's dev server/environment.
test.describe.configure({ mode: "serial" });
let apiUrl = "";
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
  const image = page.locator(".detail-icon");
  const path = await image.getAttribute("src");
  const response = await page.request.get(path!, { maxRedirects: 0 });
  const location = response.headers().location;
  expect(location).toBeTruthy();
  apiUrl = new URL(location).origin;
}
test("database products, featured homepage and public detail media/prices", async ({
  page,
}) => {
  await page.route("**/*youtube-nocookie.com/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.locator(".product-card")).toContainText(
    "Alat Sertifikat Uji",
  );
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/home-database-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/apps");
  await expect(page.locator(".product-card")).toHaveCount(2);
  await expect(page.getByText("Nama Draft Rahasia")).toHaveCount(0);
  await page.getByRole("link", { name: "Lihat Detail" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Fitur Aplikasi" }),
  ).toBeVisible();
  await expect(
    page.getByText("Ekspor PDF", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Screenshot Produk" }),
  ).toBeVisible();
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  );
  for (const text of [
    /Rp\s*125\.000/,
    /Rp\s*49\.000 \/ bulan/,
    /Rp\s*499\.000 \/ tahun/,
  ])
    await expect(page.getByText(text, { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "Coba Demo" })).toHaveAttribute(
    "href",
    "https://example.com/demo",
  );
});
test("server search includes full description, category, billing, sort and shareable URL", async ({
  page,
}) => {
  await page.goto("/apps");
  await page
    .getByRole("textbox", { name: "Cari aplikasi", exact: true })
    .fill("RAHASIA-KATALOG");
  await page.getByRole("button", { name: "Jalankan pencarian" }).click();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page).toHaveURL(/q=RAHASIA-KATALOG/);
  await page.reload();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Hapus pencarian" }).click();
  await expect(page.locator(".product-card")).toHaveCount(2);
  await page
    .getByRole("combobox", { name: "Model akses", exact: true })
    .selectOption("monthly");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page).toHaveURL(/billing=monthly/);
  await page.goto("/kategori/bisnis?sort=newest");
  await expect(page).toHaveURL(/\/apps\?category=bisnis&sort=newest/);
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.locator(".product-card")).toContainText("Bisnis Uji");
  await page.goto("/apps?sort=newest");
  await expect(page.locator(".product-card").first()).toContainText(
    "Bisnis Uji",
  );
  await page.goto("/apps?sort=name");
  await expect(page.locator(".product-card").first()).toContainText(
    "Alat Sertifikat Uji",
  );
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
  await expect(page.locator(".product-card")).toHaveCount(2);
});
test("empty published database shows professional state rather than fallback products", async ({
  page,
  request,
}) => {
  await request.post(apiUrl + "/__test/empty");
  await page.goto("/apps");
  await expect(
    page.getByRole("heading", { name: "Katalog sedang dipersiapkan" }),
  ).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(0);
  await page.goto("/apps/alat-sertifikat-uji");
  await expect(
    page.getByRole("heading", { name: "Halaman tidak ditemukan" }),
  ).toBeVisible();
  await request.post(apiUrl + "/__test/reset");
});
