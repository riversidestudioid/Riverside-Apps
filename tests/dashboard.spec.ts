import { test, expect, type Page } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";

test.describe.configure({ mode: "serial" });
let apiUrl = "";
let credentials: { admin: string; customer: string; password: string };
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7S8AAAAASUVORK5CYII=",
  "base64",
);
const noOverflow = () => document.documentElement.scrollWidth <= innerWidth;

test.beforeAll(async ({ browser, baseURL, request }) => {
  const page = await browser.newPage({ baseURL });
  await page.route("**/*youtube-nocookie.com/**", (r) => r.abort());
  await page.goto("/apps/alat-sertifikat-uji");
  const src = await page.locator(".detail-icon img").getAttribute("src");
  const response = await page.request.get(src!, { maxRedirects: 0 });
  apiUrl = new URL(response.headers().location).origin;
  credentials = await (
    await request.get(apiUrl + "/__test/credentials")
  ).json();
  await page.close();
});
test.beforeEach(async ({ page, request }) => {
  await page.route("**/*youtube-nocookie.com/**", (r) => r.abort());
  await request.post(apiUrl + "/__test/restore-admin");
});

async function login(page: Page, next = "/admin") {
  await page.goto("/login?next=" + encodeURIComponent(next));
  await page.getByLabel("Email", { exact: true }).fill(credentials.admin);
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill(credentials.password);
  await page.getByRole("button", { name: "Masuk sebagai Admin" }).click();
  await expect(page).toHaveURL(
    new RegExp(next.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"),
  );
}
async function setSession(page: Page, role: "admin" | "customer") {
  const cookies = new Map<string, string>();
  const db = createServerClient(apiUrl, "test-only-publishable-key", {
    cookies: {
      getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
      setAll(values) {
        values.forEach((v) => cookies.set(v.name, v.value));
      },
    },
  });
  const { error } = await db.auth.signInWithPassword({
    email: credentials[role],
    password: credentials.password,
  });
  expect(error).toBeNull();
  await page.context().addCookies(
    [...cookies].map(([name, value]) => ({
      name,
      value,
      domain: "127.0.0.1",
      path: "/",
      sameSite: "Lax" as const,
    })),
  );
}
const stat = (page: Page, label: string) => page.getByTestId(`stat-${label}`);

test("admin login, database statistics, responsive sidebar and logout", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(credentials.admin);
  await page.getByLabel("Kata sandi", { exact: true }).fill("invalid-input");
  await page.getByRole("button", { name: "Masuk sebagai Admin" }).click();
  await expect(page.locator(".auth-form [role=alert]")).toContainText(
    "Login gagal",
  );
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Dashboard", level: 1 }),
  ).toBeVisible();
  // Fixture: 2 published, 1 draft, 1 archived, no requests.
  await expect(stat(page, "Total Aplikasi")).toHaveText("4");
  await expect(stat(page, "Aplikasi Published")).toHaveText("2");
  await expect(stat(page, "Aplikasi Draft")).toHaveText("1");
  await expect(stat(page, "Permintaan Custom")).toHaveText("0");
  const nav = page.getByRole("navigation", { name: "Navigasi admin" });
  for (const name of [
    "Dashboard",
    "Aplikasi",
    "Permintaan Custom",
    "Pengaturan",
  ])
    await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({
    path: "artifacts/admin-desktop.png",
    fullPage: true,
  });
  for (const width of [768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(noOverflow)).toBe(true);
  }
  await page.getByRole("button", { name: "Buka navigasi admin" }).click();
  await expect(
    nav.getByRole("link", { name: "Permintaan Custom", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/admin-mobile.png", fullPage: true });
  await nav.getByRole("link", { name: "Aplikasi", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/apps$/);
  await expect(page.locator(".app-rows .list-row")).toHaveCount(4);
  expect(await page.evaluate(noOverflow)).toBe(true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator(".admin-user summary").click();
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  await expect(page).toHaveURL(/login\?status=logged-out/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

test("customer metadata cannot grant admin; API origin, role revocation and expiration are enforced", async ({
  page,
  request,
  baseURL,
}) => {
  await setSession(page, "customer");
  const customerApi = await page.request.get("/api/admin/apps");
  expect(customerApi.status()).toBe(403);
  const denied = await page.request.post("/api/admin/apps", {
    headers: { origin: baseURL! },
    data: { name: "Unauthorized" },
  });
  expect(denied.status()).toBe(403);
  await page.goto("/admin/requests");
  await expect(page).toHaveURL(/status=forbidden/);
  await page.context().clearCookies();
  await login(page);
  expect((await page.request.get("/api/admin/apps")).status()).toBe(200);
  expect(
    (
      await page.request.post("/api/admin/apps", {
        headers: { origin: "https://evil.invalid" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  await request.post(apiUrl + "/__test/revoke-admin");
  expect((await page.request.get("/api/admin/apps")).status()).toBe(403);
  await request.post(apiUrl + "/__test/restore-admin");
  const cookie = (await page.context().cookies()).find((c) =>
    c.name.endsWith("-auth-token"),
  );
  expect(cookie).toBeTruthy();
  const decoded = JSON.parse(
    Buffer.from(cookie!.value.replace(/^base64-/, ""), "base64url").toString(),
  );
  decoded.expires_at = 1;
  await page.context().addCookies([
    {
      ...cookie!,
      value:
        "base64-" + Buffer.from(JSON.stringify(decoded)).toString("base64url"),
    },
  ]);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Dashboard", level: 1 }),
  ).toBeVisible();
  const renewed = (await page.context().cookies()).find((c) =>
    c.name.endsWith("-auth-token"),
  )!;
  const expired = JSON.parse(
    Buffer.from(renewed.value.replace(/^base64-/, ""), "base64url").toString(),
  );
  expired.expires_at = 1;
  await request.post(apiUrl + "/__test/revoke-refresh");
  await page.context().addCookies([
    {
      ...renewed,
      value:
        "base64-" + Buffer.from(JSON.stringify(expired)).toString("base64url"),
    },
  ]);
  await page.goto("/admin/apps");
  await expect(page).toHaveURL(/status=expired/);
  await expect(
    page.getByText("Sesi Anda berakhir atau belum tersedia.", { exact: false }),
  ).toBeVisible();
});

test("admin creates a draft, uploads an icon, publishes, edits, archives and deletes without deployment", async ({
  page,
}) => {
  await login(page, "/admin/apps/new");
  await expect(page.getByRole("button", { name: "Publish" })).toBeDisabled();
  await page
    .getByLabel("Nama aplikasi", { exact: true })
    .fill("Aplikasi Admin Uji");
  await expect(page.getByLabel("Slug URL", { exact: true })).toHaveValue(
    "aplikasi-admin-uji",
  );
  await page
    .getByLabel("Deskripsi singkat", { exact: true })
    .fill("Ringkasan aplikasi admin.");
  await page
    .getByLabel("Deskripsi lengkap", { exact: true })
    .fill("Aplikasi untuk menguji CRUD admin dan publikasi katalog.");
  await page
    .getByLabel("Fitur utama (satu per baris)", { exact: true })
    .fill("Fitur tersimpan di database");
  await page
    .getByRole("combobox", { name: "Kategori", exact: true })
    .selectOption({ label: "Pendidikan" });
  await page
    .getByLabel("URL aplikasi (HTTPS)", { exact: true })
    .fill("https://example.com/admin-app");
  await page.getByRole("button", { name: "Simpan Draft" }).click();
  await expect(page).toHaveURL(/\/admin\/apps\/[a-f0-9-]{36}\?saved=1$/);
  await expect(page.getByText("Draft berhasil disimpan.")).toBeVisible();
  const editor = page.url().split("?")[0];

  // Publishing without an icon is rejected by the database rule.
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.locator(".form-alert")).toContainText("ikon");

  await page.getByLabel("File", { exact: true }).setInputFiles({
    name: "icon.png",
    mimeType: "image/png",
    buffer: png,
  });
  await page.getByLabel("Deskripsi media", { exact: true }).fill("Ikon uji");
  await page.getByRole("button", { name: "Unggah Media" }).click();
  await expect(page.getByText("Media berhasil ditambahkan.")).toBeVisible();
  const card = page.locator(".media-item").filter({ hasText: "Ikon uji" });
  await card.getByRole("button", { name: "Ganti Media" }).click();
  await page.getByLabel("File", { exact: true }).setInputFiles({
    name: "icon-new.png",
    mimeType: "image/png",
    buffer: png,
  });
  await page
    .getByLabel("Deskripsi media", { exact: true })
    .fill("Ikon pengganti");
  await page.getByRole("button", { name: "Simpan Media Pengganti" }).click();
  await expect(page.getByText("Media berhasil diganti.")).toBeVisible();

  await page.getByLabel("Tampilkan di Aplikasi Pilihan (beranda)").check();
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(
    page.getByText("Aplikasi berhasil dipublikasikan."),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/admin-editor.png", fullPage: true });
  await page.goto("/apps/aplikasi-admin-uji");
  await expect(
    page.getByRole("heading", { name: "Aplikasi Admin Uji", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText("Fitur tersimpan di database", { exact: true }),
  ).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".app-card")).toHaveCount(2);

  await page.goto(editor);
  await page
    .getByLabel("Nama aplikasi", { exact: true })
    .fill("Aplikasi Diperbarui");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(
    page.getByText("Aplikasi berhasil dipublikasikan."),
  ).toBeVisible();
  await page.goto("/apps/aplikasi-admin-uji");
  await expect(
    page.getByRole("heading", { name: "Aplikasi Diperbarui", level: 1 }),
  ).toBeVisible();

  await page.goto(editor);
  await expect(
    page.getByRole("button", { name: "Hapus Aplikasi" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Arsipkan" }).click();
  await expect(page.getByText("Aplikasi diarsipkan.")).toBeVisible();
  await page.getByRole("button", { name: "Hapus Aplikasi" }).click();
  await page.getByRole("button", { name: "Ya, Hapus Permanen" }).click();
  await expect(page).toHaveURL(/\/admin\/apps$/);
  await page.goto("/apps/aplikasi-admin-uji");
  await expect(
    page.getByRole("heading", { name: "Halaman tidak ditemukan" }),
  ).toBeVisible();
});

test("visitor submits a custom request; admin reviews, updates status and notes, then deletes it", async ({
  page,
  browser,
  baseURL,
}) => {
  const visitor = await browser.newPage({ baseURL });
  await visitor.goto("/custom");
  const submit = visitor.getByRole("button", { name: "Kirim Permintaan" });
  await visitor.waitForTimeout(3200);
  await submit.click();
  await expect(visitor.locator(".form-alert")).toContainText(
    "Periksa kembali isian yang ditandai.",
  );
  await expect(visitor.getByText("Nama minimal 2 karakter.")).toBeVisible();
  await expect(
    visitor.getByText("Anda perlu menyetujui Kebijakan Privasi."),
  ).toBeVisible();
  await visitor.getByLabel("Nama", { exact: true }).fill("Budi Santoso");
  await visitor.getByLabel("Email", { exact: true }).fill("Budi@Example.com");
  await visitor.getByLabel("Nomor WhatsApp").fill("0812-3456-7890");
  await visitor.getByLabel("Nama proyek").fill("Sistem Absensi Jemaat");
  await visitor.getByLabel("Web App", { exact: true }).check();
  await visitor
    .getByLabel("Deskripsi kebutuhan")
    .fill("Kami membutuhkan aplikasi absensi jemaat dengan laporan mingguan.");
  await visitor.getByRole("checkbox", { name: /Saya menyetujui/ }).check();
  await visitor.setViewportSize({ width: 375, height: 900 });
  expect(await visitor.evaluate(noOverflow)).toBe(true);
  await submit.click();
  await expect(
    visitor.getByRole("heading", {
      name: "Terima kasih, permintaan Anda sudah kami terima.",
    }),
  ).toBeVisible();
  await visitor.close();

  await login(page, "/admin");
  await expect(stat(page, "Permintaan Custom")).toHaveText("1");
  await page.goto("/admin/requests");
  await page.getByRole("link", { name: /Sistem Absensi Jemaat/ }).click();
  await expect(
    page.getByRole("heading", { name: "Sistem Absensi Jemaat" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "budi@example.com" }),
  ).toHaveAttribute("href", "mailto:budi@example.com");
  await expect(
    page.getByRole("link", { name: "+6281234567890" }),
  ).toHaveAttribute("href", "https://wa.me/6281234567890");
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("contacted");
  await page
    .getByLabel("Catatan internal")
    .fill("Sudah dihubungi via WhatsApp, jadwalkan demo.");
  await page.getByRole("button", { name: "Simpan Perubahan" }).click();
  await expect(page.getByText("Perubahan disimpan.")).toBeVisible();
  await page.screenshot({
    path: "artifacts/admin-request.png",
    fullPage: true,
  });
  await page.goto("/admin/requests?status=contacted");
  await expect(page.locator(".list-rows .list-row")).toHaveCount(1);
  await expect(page.locator(".list-rows")).toContainText("Dihubungi");
  await page.goto("/admin/requests?status=new");
  await expect(page.locator(".list-rows .list-row")).toHaveCount(0);
  await page.goto("/admin/requests?status=contacted");
  await page.getByRole("link", { name: /Sistem Absensi Jemaat/ }).click();
  await expect(page.getByLabel("Catatan internal")).toHaveValue(
    "Sudah dihubungi via WhatsApp, jadwalkan demo.",
  );
  await page.getByRole("button", { name: "Hapus Permintaan" }).click();
  await page.getByRole("button", { name: "Ya, Hapus Permanen" }).click();
  await expect(page).toHaveURL(/\/admin\/requests$/);
  await expect(
    page.getByText("Belum ada permintaan custom yang masuk."),
  ).toBeVisible();
});

test("settings update identity, contacts, social links and logo without deployment", async ({
  page,
}) => {
  await login(page, "/admin/settings");
  await page
    .getByLabel("Deskripsi website", { exact: true })
    .fill("Deskripsi uji Riverside Studio.");
  await page
    .getByLabel("Instagram", { exact: true })
    .fill("https://instagram.com/riverside-uji");
  await page
    .getByLabel("Email kontak", { exact: true })
    .fill("halo@example.com");
  await page.getByRole("button", { name: "Simpan Pengaturan" }).click();
  await expect(page.getByText("Pengaturan berhasil disimpan.")).toBeVisible();

  await page
    .getByLabel("Facebook", { exact: true })
    .fill("http://insecure.test");
  await page.getByRole("button", { name: "Simpan Pengaturan" }).click();
  await expect(page.locator(".form-alert")).toContainText("HTTPS");
  await page.getByLabel("Facebook", { exact: true }).fill("");

  await page.locator('input[type="file"]').setInputFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.getByText("Logo berhasil diperbarui.")).toBeVisible();

  await page.goto("/");
  const footer = page.locator(".site-footer");
  await expect(
    footer.getByText("Deskripsi uji Riverside Studio."),
  ).toBeVisible();
  await expect(footer.getByRole("link", { name: "Instagram" })).toHaveAttribute(
    "href",
    "https://instagram.com/riverside-uji",
  );
  await expect(
    footer.getByRole("link", { name: "halo@example.com" }),
  ).toHaveAttribute("href", "mailto:halo@example.com");
  await expect(page.locator(".site-header .brand-logo")).toHaveAttribute(
    "src",
    /\/storage\/v1\/object\/public\/site-assets\/logo\/[a-f0-9-]{36}\.png$/,
  );

  await page.goto("/admin/settings");
  await page.getByRole("button", { name: "Gunakan Logo Bawaan" }).click();
  await expect(page.getByText("Logo dihapus.")).toBeVisible();
  await page.getByLabel("Deskripsi website", { exact: true }).fill("");
  await page.getByLabel("Instagram", { exact: true }).fill("");
  await page.getByLabel("Email kontak", { exact: true }).fill("");
  await page.getByRole("button", { name: "Simpan Pengaturan" }).click();
  await expect(page.getByText("Pengaturan berhasil disimpan.")).toBeVisible();
  await page.goto("/admin/plans");
  await expect(page).toHaveURL(/\/admin\/apps$/);
  await page.goto("/admin/categories");
  await expect(
    page.getByRole("heading", { name: "Kategori", level: 1 }),
  ).toBeVisible();
  await page.goto("/admin/media");
  await expect(
    page.getByRole("heading", { name: "File Media", level: 1 }),
  ).toBeVisible();
});
