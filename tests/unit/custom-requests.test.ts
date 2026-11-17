import { test } from "node:test";
import assert from "node:assert/strict";
import type { PGlite } from "@electric-sql/pglite";
import {
  createTestDatabase as setup,
  admin,
  customer,
} from "../helpers/database";
import {
  customRequestSchema,
  normalizeWhatsapp,
} from "../../src/lib/custom/validation";
import {
  settingsSchema,
  defaultSettings,
} from "../../src/lib/admin/settings-validation";
import { appSchema, safeExternalUrl } from "../../src/lib/catalog/validation";

const app = "33333333-3333-4333-8333-333333333333";
const fp = (n: number) => n.toString(16).padStart(64, "0");

async function as(db: PGlite, role: "anon" | "authenticated", id = "") {
  await db.exec(
    `reset role;set role ${role};select set_config('request.jwt.claim.sub','${id}',false);`,
  );
}
function request(overrides: Record<string, unknown> = {}) {
  return {
    name: "Budi Santoso",
    email: "budi@example.com",
    whatsapp: "6281234567890",
    app_type: "web_app",
    project_name: "Sistem Absensi",
    description: "Aplikasi absensi jemaat dengan laporan mingguan.",
    privacy_consent: true,
    client_fingerprint: fp(1),
    ...overrides,
  };
}
async function submit(db: PGlite, payload: unknown) {
  return db.query<{ id: string }>(
    "select public.submit_custom_request($1::jsonb) as id",
    [JSON.stringify(payload)],
  );
}
const rateLimited = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "PT429";

test("v2 publication needs an icon, not pricing; saving without plans keeps legacy plan rows", async () => {
  const db = await setup();
  try {
    await as(db, "authenticated", admin);
    const cat = (
      await db.query<{ id: string }>("select id from categories limit 1")
    ).rows[0].id;
    const base = {
      id: app,
      revision: 0,
      name: "Aplikasi Uji",
      slug: "aplikasi-uji",
      tagline: "",
      short_description: "Ringkas",
      description: "Aplikasi untuk menguji publikasi katalog v2.",
      key_features: ["Fitur utama"],
      category_id: cat,
      platform: "web",
      status: "draft",
      is_visible: false,
      is_featured: false,
      featured_order: 0,
      demo_url: "",
      launch_url: "https://example.com",
    };
    const save = (p: unknown) =>
      db.query("select public.save_catalog_app($1::jsonb)", [
        JSON.stringify(p),
      ]);
    await save({
      ...base,
      plans: [
        {
          name: "Lama",
          billing_type: "one_time",
          price_idr: 100000,
          license_policy: "Lisensi lama.",
          features: [],
          is_active: true,
        },
      ],
    });
    const revision = async () =>
      (
        await db.query<{ revision: number }>(
          `select revision from apps where id='${app}'`,
        )
      ).rows[0].revision;
    await save({ ...base, revision: await revision(), name: "Tanpa Paket" });
    assert.equal((await db.query("select * from plans")).rows.length, 1);
    await assert.rejects(
      save({
        ...base,
        revision: await revision(),
        status: "published",
        is_visible: true,
      }),
      /Icon required/,
    );
    await db.exec(
      `insert into app_media(app_id,kind,storage_path,alt_text) values('${app}','icon','${app}/44444444-4444-4444-8444-444444444444.png','Ikon')`,
    );
    await db.exec(`reset role; delete from plans;`);
    await as(db, "authenticated", admin);
    await save({
      ...base,
      revision: await revision(),
      status: "published",
      is_visible: true,
    });
    await as(db, "anon");
    assert.equal((await db.query("select * from apps")).rows.length, 1);
    assert.equal((await db.query("select * from plans")).rows.length, 0);
  } finally {
    await db.close();
  }
});

test("custom requests: anonymous RPC submit only, validation, rate limits and admin-only access", async () => {
  const db = await setup();
  try {
    await as(db, "anon");
    await assert.rejects(db.query("select * from custom_requests"));
    await assert.rejects(
      db.exec(
        "insert into custom_requests(name,email,whatsapp,app_type,project_name,description,privacy_consent_at) values('Spam','s@x.io','6281234567','website','Spam','x'||repeat('y',30),now())",
      ),
    );
    await assert.rejects(
      db.query("select * from private.custom_request_throttle"),
    );
    const { rows } = await submit(db, request());
    assert.match(rows[0].id, /^[0-9a-f-]{36}$/);
    for (const invalid of [
      request({ privacy_consent: false }),
      request({ client_fingerprint: "not-a-hash" }),
      request({ email: "bukan-email" }),
      request({ whatsapp: "+62 812" }),
      request({ description: "terlalu pendek" }),
      request({ app_type: "game" }),
      request({ name: " " }),
    ])
      await assert.rejects(submit(db, invalid));

    // Per-email limit (3/hour) applies even with different fingerprints.
    await submit(db, request({ client_fingerprint: fp(2) }));
    await submit(db, request({ client_fingerprint: fp(3) }));
    await assert.rejects(
      submit(db, request({ client_fingerprint: fp(4) })),
      rateLimited,
    );
    // Per-fingerprint limit (5/hour) applies across different emails.
    for (let i = 0; i < 5; i++)
      await submit(
        db,
        request({ email: `u${i}@example.com`, client_fingerprint: fp(9) }),
      );
    await assert.rejects(
      submit(
        db,
        request({ email: "u9@example.com", client_fingerprint: fp(9) }),
      ),
      rateLimited,
    );

    await as(db, "authenticated", customer);
    assert.equal(
      (await db.query("select * from custom_requests")).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "update custom_requests set status='accepted' returning id",
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (await db.query("delete from custom_requests returning id")).rows.length,
      0,
    );

    await as(db, "authenticated", admin);
    const all = await db.query<{
      id: string;
      email: string;
      whatsapp: string;
      status: string;
    }>(
      "select id,email,whatsapp,status from custom_requests order by created_at",
    );
    assert.equal(all.rows.length, 8);
    assert.equal(all.rows[0].status, "new");
    const id = all.rows[0].id;
    await db.exec(
      `update custom_requests set status='contacted',admin_notes='Dihubungi' where id='${id}'`,
    );
    await assert.rejects(
      db.exec(`update custom_requests set name='Ubah' where id='${id}'`),
    );
    await assert.rejects(
      db.exec(`update custom_requests set status='paid' where id='${id}'`),
    );
    assert.ok(
      (
        await db.query(
          `select * from audit_logs where entity_type='custom_requests' and entity_id='${id}' and actor_id='${admin}'`,
        )
      ).rows.length > 0,
    );
    assert.equal(
      (
        await db.query(
          `delete from custom_requests where id='${id}' returning id`,
        )
      ).rows.length,
      1,
    );

    // Throttle rows older than 24 hours are purged on the next accepted submission.
    await db.exec(
      `reset role;insert into private.custom_request_throttle(fingerprint,created_at) values('${fp(77)}', now() - interval '2 days');`,
    );
    await as(db, "anon");
    await submit(
      db,
      request({ email: "bersih@example.com", client_fingerprint: fp(40) }),
    );
    await db.exec("reset role");
    assert.equal(
      (
        await db.query(
          `select * from private.custom_request_throttle where fingerprint='${fp(77)}'`,
        )
      ).rows.length,
      0,
    );
    // Global flood limit: 30 submissions per 10 minutes.
    await db.exec(`insert into custom_requests(name,email,whatsapp,app_type,project_name,description,privacy_consent_at)
      select 'Isi '||g,'flood'||g||'@example.com','6281234567','website','Proyek '||g,repeat('x',25),now() from generate_series(1,30) g;`);
    await as(db, "anon");
    await assert.rejects(
      submit(
        db,
        request({ email: "baru@example.com", client_fingerprint: fp(50) }),
      ),
      rateLimited,
    );
  } finally {
    await db.close();
  }
});

test("settings whitelist, HTTPS social links, safe logo path and admin-only logo storage", async () => {
  const db = await setup();
  try {
    await as(db, "authenticated", admin);
    const payload = {
      site_name: "Riverside Apps",
      tagline: "by Riverside Studio",
      support_email: "",
      support_whatsapp: "",
      site_description: "Katalog aplikasi.",
      instagram_url: "https://instagram.com/riverside",
    };
    await db.query("select save_site_settings($1::jsonb)", [
      JSON.stringify(payload),
    ]);
    await assert.rejects(
      db.query("select save_site_settings($1::jsonb)", [
        JSON.stringify({ ...payload, instagram_url: "javascript:alert(1)" }),
      ]),
    );
    await assert.rejects(
      db.exec(
        "insert into site_settings(key,value) values('service_role_key','secret')",
      ),
    );
    await assert.rejects(
      db.exec(
        "update site_settings set value='../../etc/passwd' where key='logo_path'",
      ),
    );
    const logo = "logo/55555555-5555-4555-8555-555555555555.png";
    await assert.rejects(
      db.exec(
        "insert into storage.objects(bucket_id,name) values('site-assets','logo/evil.svg')",
      ),
    );
    await db.exec(
      `insert into storage.objects(bucket_id,name) values('site-assets','${logo}')`,
    );
    await db.exec(
      `update site_settings set value='${logo}' where key='logo_path'`,
    );
    assert.equal(
      (
        await db.query(
          `delete from storage.objects where name='${logo}' returning id`,
        )
      ).rows.length,
      0,
    );
    for (const [role, id] of [
      ["authenticated", customer],
      ["anon", ""],
    ] as const) {
      await as(db, role, id);
      await assert.rejects(
        db.exec(
          "insert into storage.objects(bucket_id,name) values('site-assets','logo/66666666-6666-4666-8666-666666666666.png')",
        ),
      );
      assert.equal(
        (await db.query("select * from storage.objects")).rows.length,
        0,
      );
      assert.equal(
        (
          await db.query<{ value: string }>(
            "select value from site_settings where key='instagram_url'",
          )
        ).rows[0].value,
        "https://instagram.com/riverside",
      );
    }
    await as(db, "authenticated", admin);
    await db.exec("update site_settings set value='' where key='logo_path'");
    assert.equal(
      (
        await db.query(
          `delete from storage.objects where name='${logo}' returning id`,
        )
      ).rows.length,
      1,
    );
  } finally {
    await db.close();
  }
});

test("server validation normalizes WhatsApp, requires consent and rejects unsafe URLs", () => {
  assert.equal(normalizeWhatsapp("0812-3456-7890"), "6281234567890");
  assert.equal(normalizeWhatsapp("+62 812 3456 7890"), "6281234567890");
  const valid = {
    name: " Budi ",
    email: " Budi@Example.COM ",
    whatsapp: "0812 3456 7890",
    app_type: "mobile_app",
    project_name: "Aplikasi Sekolah",
    description: "Aplikasi informasi sekolah untuk orang tua murid.",
    privacy_consent: true,
  };
  const parsed = customRequestSchema.parse(valid);
  assert.equal(parsed.email, "budi@example.com");
  assert.equal(parsed.name, "Budi");
  assert.equal(parsed.whatsapp, "6281234567890");
  for (const invalid of [
    { ...valid, privacy_consent: false },
    { ...valid, email: "javascript:alert(1)" },
    { ...valid, whatsapp: "12" },
    { ...valid, app_type: "game" },
    { ...valid, description: "pendek" },
  ])
    assert.equal(customRequestSchema.safeParse(invalid).success, false);
  assert.equal(
    settingsSchema.safeParse({
      ...defaultSettings,
      youtube_url: "http://youtube.com",
    }).success,
    false,
  );
  assert.equal(
    settingsSchema.safeParse({ ...defaultSettings, logo_path: "../secret.png" })
      .success,
    false,
  );
  assert.equal(
    safeExternalUrl("https://example.com/app"),
    "https://example.com/app",
  );
  for (const unsafe of [
    "javascript:alert(1)",
    "http://example.com",
    "https://u:p@example.com",
    null,
  ])
    assert.equal(safeExternalUrl(unsafe), null);
  const appInput = {
    id: app,
    revision: 0,
    slug: "aplikasi",
    name: "Aplikasi",
    tagline: "",
    short_description: "",
    description: "Deskripsi lengkap aplikasi yang cukup panjang.",
    category_id: "",
    platform: "web",
    status: "published",
    is_visible: true,
    is_featured: false,
    featured_order: 0,
    demo_url: "",
    launch_url: "https://example.com",
  };
  assert.equal(appSchema.safeParse(appInput).success, false);
  assert.equal(
    appSchema.safeParse({
      ...appInput,
      category_id: "44444444-4444-4444-8444-444444444444",
    }).success,
    true,
  );
});
