import { test, expect, type Page } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";

test.describe.configure({ mode: "serial" });
let apiUrl = "";
let credentials: { admin: string; customer: string; password: string };
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7S8AAAAASUVORK5CYII=",
  "base64",
);
test.beforeAll(async ({ browser, baseURL, request }) => {
  const page = await browser.newPage({ baseURL });
  await page.route("**/*youtube-nocookie.com/**", (r) => r.abort());
  await page.goto("/apps/alat-sertifikat-uji");
  const src = await page.locator(".detail-icon").getAttribute("src");
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

test("admin login, overview, mobile navigation and logout", async ({
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
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Total Aplikasi", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "artifacts/admin-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Buka navigasi admin" }).click();
  await expect(
    page.getByRole("link", { name: "Kelola Media", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/admin-mobile.png", fullPage: true });
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
  await page.goto("/admin/apps");
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
    page.getByRole("heading", { name: "Overview", exact: true }),
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

test("admin creates, uploads, replaces, publishes, updates, archives and deletes without deployment", async ({
  page,
}) => {
  await login(page, "/admin/apps/new");
  await page
    .getByLabel("Nama aplikasi", { exact: true })
    .fill("Aplikasi Admin Uji");
  await page.getByLabel("Slug", { exact: true }).fill("admin-crud-uji");
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
  await page.getByRole("button", { name: "Tambah Paket", exact: true }).click();
  await page.getByLabel("Nama paket", { exact: true }).fill("Paket Gratis");
  await page
    .getByLabel("Ketentuan lisensi / masa akses", { exact: true })
    .fill("Akses gratis untuk satu pengguna.");
  await page
    .getByRole("button", { name: "Simpan Aplikasi", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/apps\/[a-f0-9-]{36}$/);
  const editor = page.url();
  async function upload(kind: string, description: string) {
    await page
      .getByRole("combobox", { name: "Jenis media", exact: true })
      .selectOption(kind);
    await page.getByLabel("File", { exact: true }).setInputFiles({
      name: kind + ".png",
      mimeType: "image/png",
      buffer: png,
    });
    await page.getByLabel("Deskripsi media", { exact: true }).fill(description);
    await page
      .getByRole("button", { name: "Unggah / Tambah Media", exact: true })
      .click();
    await expect(
      page.getByText("Media berhasil ditambahkan.", { exact: true }),
    ).toBeVisible();
  }
  await upload("icon", "Ikon pengujian");
  await upload("thumbnail", "Thumbnail pengujian");
  const card = page
    .locator(".media-manager article")
    .filter({ hasText: "Ikon pengujian" });
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
  await expect(
    page.getByText("Media berhasil diganti.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("published");
  await page
    .getByLabel("Tampilkan di katalog publik setelah published", {
      exact: true,
    })
    .check();
  await page
    .getByRole("button", { name: "Simpan Aplikasi", exact: true })
    .click();
  await expect(
    page.getByText("Aplikasi berhasil disimpan.", { exact: true }),
  ).toBeVisible();
  await page.goto("/apps/admin-crud-uji");
  await expect(
    page.getByRole("heading", { name: "Aplikasi Admin Uji", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Fitur tersimpan di database", { exact: true }),
  ).toBeVisible();
  await page.goto(editor);
  await page
    .getByLabel("Nama aplikasi", { exact: true })
    .fill("Aplikasi Diperbarui");
  await page
    .getByRole("button", { name: "Simpan Aplikasi", exact: true })
    .click();
  await expect(
    page.getByText("Aplikasi berhasil disimpan.", { exact: true }),
  ).toBeVisible();
  await page.goto("/apps/admin-crud-uji");
  await expect(
    page.getByRole("heading", { name: "Aplikasi Diperbarui", exact: true }),
  ).toBeVisible();
  await page.goto(editor);
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("archived");
  await page
    .getByRole("button", { name: "Simpan Aplikasi", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Hapus Aplikasi", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Hapus Aplikasi", exact: true })
    .click();
  await page.getByRole("button", { name: "Ya, Hapus Permanen" }).click();
  await expect(page).toHaveURL(/\/admin\/apps$/);
  await page.goto("/apps/admin-crud-uji");
  await expect(
    page.getByRole("heading", { name: "Halaman tidak ditemukan" }),
  ).toBeVisible();
});

test("media, plans and settings pages work; public settings update without deployment", async ({
  page,
}) => {
  await login(page, "/admin/media");
  await expect(
    page.getByRole("heading", { name: "Kelola Media", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/plans");
  await expect(
    page.getByRole("heading", { name: "Kelola Paket Harga" }),
  ).toBeVisible();
  await expect(page.getByText("Bulanan", { exact: true })).toBeVisible();
  await page.goto("/admin/settings");
  await page
    .getByLabel("Subteks identitas", { exact: true })
    .fill("by Riverside Test Studio");
  await page.getByRole("button", { name: "Simpan Pengaturan" }).click();
  await expect(
    page.getByText("Pengaturan berhasil disimpan.", { exact: true }),
  ).toBeVisible();
  await page.goto("/");
  await expect(
    page.getByText("by Riverside Test Studio", { exact: true }).first(),
  ).toBeVisible();
  await page.goto("/admin/settings");
  await page
    .getByLabel("Subteks identitas", { exact: true })
    .fill("by Riverside Studio");
  await page.getByRole("button", { name: "Simpan Pengaturan" }).click();
  await expect(
    page.getByText("Pengaturan berhasil disimpan.", { exact: true }),
  ).toBeVisible();
});
