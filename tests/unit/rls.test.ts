import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createTestDatabase as setup } from "../helpers/database";
import { PGlite } from "@electric-sql/pglite";
const admin = "11111111-1111-4111-8111-111111111111";
const customer = "22222222-2222-4222-8222-222222222222";
const app = "33333333-3333-4333-8333-333333333333";
const path = `${app}/44444444-4444-4444-8444-444444444444.png`;
async function identity(db: PGlite, role = "authenticated", id = admin) {
  await db.exec(
    `reset role;set role ${role};select set_config('request.jwt.claim.sub','${id}',false);`,
  );
}
function payload(category: string, revision = 0) {
  return {
    id: app,
    revision,
    name: "Aplikasi Uji",
    slug: "aplikasi-uji",
    tagline: "Solusi digital",
    short_description: "Contoh pengujian",
    description: "Aplikasi untuk menguji keamanan katalog.",
    category_id: category,
    platform: "web",
    status: "draft",
    is_visible: false,
    is_featured: true,
    featured_order: 1,
    demo_url: "",
    launch_url: "https://example.com",
    plans: [
      {
        name: "Gratis",
        billing_type: "free",
        price_idr: 0,
        license_policy: "Gratis untuk penggunaan pribadi.",
        features: ["Fitur utama"],
        is_active: true,
      },
    ],
  };
}
async function save(db: PGlite, p: unknown) {
  return db.query("select public.save_catalog_app($1::jsonb)", [
    JSON.stringify(p),
  ]);
}
test("migration and RLS: anonymous/customer isolation, admin CRUD, publication, private storage and revocation", async () => {
  const db = await setup();
  try {
    await identity(db);
    const cat = (
      await db.query<{ id: string }>("select id from categories limit 1")
    ).rows[0].id;
    const p = payload(cat);
    await save(db, p);
    await db.exec(
      `insert into app_media(app_id,kind,storage_path,alt_text) values('${app}','thumbnail','${path}','Thumbnail');insert into storage.objects(bucket_id,name) values('app-media','${path}');`,
    );
    await identity(db, "anon", "");
    assert.equal((await db.query("select * from apps")).rows.length, 0);
    assert.equal((await db.query("select * from app_media")).rows.length, 0);
    assert.equal((await db.query("select * from plans")).rows.length, 0);
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      0,
    );
    await assert.rejects(
      db.exec("insert into apps(slug,name) values('hack','Hack')"),
    );
    await identity(db, "authenticated", customer);
    assert.equal((await db.query("select * from apps")).rows.length, 0);
    assert.equal(
      (await db.query("select * from admin_members")).rows.length,
      0,
    );
    await assert.rejects(save(db, p));
    await assert.rejects(
      db.exec(`insert into admin_members(user_id) values('${customer}')`),
    );
    await assert.rejects(
      db.exec(
        `insert into storage.objects(bucket_id,name) values('app-media','${path}')`,
      ),
    );
    await identity(db);
    const rev = (
      await db.query<{ revision: number }>(
        `select revision from apps where id='${app}'`,
      )
    ).rows[0].revision;
    await save(db, {
      ...p,
      revision: rev,
      status: "published",
      is_visible: true,
    });
    await identity(db, "anon", "");
    assert.equal((await db.query("select * from apps")).rows.length, 1);
    assert.equal((await db.query("select * from plans")).rows.length, 1);
    assert.equal((await db.query("select * from app_media")).rows.length, 1);
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      1,
    );
    await identity(db);
    await assert.rejects(save(db, { ...p, revision: 0 }));
    await assert.rejects(
      db.exec(`update plans set price_idr=null where app_id='${app}'`),
    );
    await assert.rejects(
      db.exec(
        `insert into plans(app_id,name,billing_type,price_idr) values('${app}','Invalid','monthly',null)`,
      ),
    );
    assert.equal(
      (
        await db.query(
          `delete from storage.objects where name='${path}' returning *`,
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.exec(`delete from app_media where app_id='${app}'`),
    );
    await db.exec(
      `update apps set status='draft',is_visible=false where id='${app}'`,
    );
    await assert.rejects(
      db.exec(
        `update apps set status='published',is_visible=true,launch_url=null where id='${app}'`,
      ),
    );
    await db.exec(`delete from app_media where app_id='${app}'`);
    await assert.rejects(
      db.exec(
        `update apps set status='published',is_visible=true where id='${app}'`,
      ),
    );
    assert.ok((await db.query("select * from audit_logs")).rows.length > 0);
    await db.exec("reset role");
    await db.exec(`delete from admin_members where user_id='${admin}'`);
    await identity(db);
    assert.equal((await db.query("select * from apps")).rows.length, 0);
    await assert.rejects(save(db, p));
  } finally {
    await db.close();
  }
});
test("transactional editor rolls back invalid publication and protects integer prices", async () => {
  const db = await setup();
  try {
    await identity(db);
    const cat = (
      await db.query<{ id: string }>("select id from categories limit 1")
    ).rows[0].id;
    const p = payload(cat);
    await save(db, p);
    const before = (await db.query("select * from apps")).rows[0];
    await assert.rejects(
      save(db, { ...p, revision: 1, status: "published", is_visible: true }),
    );
    assert.deepEqual((await db.query("select * from apps")).rows[0], before);
    await assert.rejects(
      db.exec(
        `insert into plans(app_id,name,billing_type,price_idr) values('${app}','Bad','one_time',-1)`,
      ),
    );
    await assert.rejects(
      db.exec(
        `insert into plans(app_id,name,billing_type,price_idr) values('${app}','Bad','free',10)`,
      ),
    );
    await db.exec(`delete from apps where id='${app}'`);
    assert.equal((await db.query("select * from plans")).rows.length, 0);
  } finally {
    await db.close();
  }
});

test("all four pricing models round-trip and inactive categories hide app, plans, media and storage", async () => {
  const db = await setup();
  try {
    await identity(db);
    const cat = (
      await db.query<{ id: string }>("select id from categories limit 1")
    ).rows[0].id;
    const p = payload(cat);
    const plans = ["free", "one_time", "monthly", "yearly"].map(
      (billing_type, i) => ({
        name: billing_type,
        billing_type,
        price_idr: i * 10000,
        license_policy: "Ketentuan lisensi yang eksplisit.",
        features: ["Fitur utama"],
        is_active: true,
      }),
    );
    await save(db, { ...p, plans });
    await db.exec(
      `insert into app_media(app_id,kind,storage_path,alt_text) values('${app}','thumbnail','${path}','Thumbnail');insert into storage.objects(bucket_id,name) values('app-media','${path}');`,
    );
    await save(db, {
      ...p,
      revision: 1,
      status: "published",
      is_visible: true,
      plans,
    });
    await identity(db, "anon", "");
    assert.equal((await db.query("select * from plans")).rows.length, 4);
    await identity(db);
    await db.exec(`update categories set is_active=false where id='${cat}'`);
    await identity(db, "anon", "");
    for (const table of ["apps", "plans", "app_media", "storage.objects"])
      assert.equal((await db.query("select * from " + table)).rows.length, 0);
    await identity(db);
    await db.exec(
      `update apps set status='archived',is_visible=false where id='${app}'`,
    );
    await db.exec(`delete from apps where id='${app}'`);
    assert.equal((await db.query("select * from plans")).rows.length, 0);
    assert.equal((await db.query("select * from app_media")).rows.length, 0);
    assert.equal(
      (
        await db.query(
          `delete from storage.objects where name='${path}' returning *`,
        )
      ).rows.length,
      1,
    );
  } finally {
    await db.close();
  }
});

test("profiles: owners can edit identity but cannot read other users or grant admin privileges", async () => {
  const db = await setup();
  try {
    await identity(db);
    await db.exec(
      `insert into profiles(id,full_name) values('${admin}','Admin Studio')`,
    );
    await identity(db, "authenticated", customer);
    await db.exec(
      `insert into profiles(id,full_name) values('${customer}','  Pelanggan Riverside  ')`,
    );
    const own = (
      await db.query<{ id: string; full_name: string; updated_at: Date }>(
        `select * from profiles`,
      )
    ).rows;
    assert.equal(own.length, 1);
    assert.equal(own[0].id, customer);
    assert.equal(own[0].full_name, "Pelanggan Riverside");
    await db.exec(
      `update profiles set full_name='Nama Baru' where id='${customer}'`,
    );
    const updated = (
      await db.query<{ full_name: string; updated_at: Date }>(
        `select * from profiles`,
      )
    ).rows[0];
    assert.equal(updated.full_name, "Nama Baru");
    assert.ok(updated.updated_at >= own[0].updated_at);
    assert.equal(
      (
        await db.query(
          `update profiles set full_name='Hacked' where id='${admin}' returning id`,
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.exec(`update profiles set id='${admin}' where id='${customer}'`),
    );
    await assert.rejects(
      db.exec(`update profiles set created_at=now() where id='${customer}'`),
    );
    await assert.rejects(
      db.exec(`update profiles set role='admin' where id='${customer}'`),
    );
    await assert.rejects(
      db.exec(`insert into admin_members(user_id) values('${customer}')`),
    );
    await assert.rejects(
      db.exec(`delete from profiles where id='${customer}'`),
    );
    await assert.rejects(
      db.exec(
        `update profiles set full_name=repeat('x',121) where id='${customer}'`,
      ),
    );
    await identity(db, "anon", "");
    await assert.rejects(db.query("select * from profiles"));
    await assert.rejects(
      db.exec(
        `insert into profiles(id,full_name) values('${customer}','Anonymous')`,
      ),
    );
    await identity(db);
    assert.equal((await db.query("select * from profiles")).rows.length, 2);
    await db.exec("reset role");
    await db.exec(`delete from auth.users where id='${customer}'`);
    assert.equal(
      (await db.query(`select * from profiles where id='${customer}'`)).rows
        .length,
      0,
    );
  } finally {
    await db.close();
  }
});

test("schema constraints enforce private icon uniqueness, YouTube identity and safe draft seed", async () => {
  const db = await setup();
  try {
    await db.exec(readFileSync("supabase/seed.sql", "utf8"));
    await db.exec(readFileSync("supabase/seed.sql", "utf8"));
    assert.equal((await db.query("select * from apps")).rows.length, 3);
    await identity(db, "anon", "");
    assert.equal((await db.query("select * from apps")).rows.length, 0);
    await identity(db);
    const cat = (
      await db.query<{ id: string }>("select id from categories limit 1")
    ).rows[0].id;
    await save(db, payload(cat));
    await db.exec(
      `insert into app_media(app_id,kind,storage_path,alt_text) values('${app}','icon','${path}','Ikon Aplikasi')`,
    );
    await assert.rejects(
      db.exec(
        `insert into app_media(app_id,kind,storage_path,alt_text) values('${app}','icon','${app}/55555555-5555-4555-8555-555555555555.png','Duplikat')`,
      ),
    );
    await assert.rejects(
      db.exec(
        `insert into app_media(app_id,kind,alt_text) values('${app}','youtube','Tanpa ID')`,
      ),
    );
    await assert.rejects(
      db.exec(
        `insert into app_media(app_id,kind,youtube_id,alt_text) values('${app}','youtube','invalid','ID tidak valid')`,
      ),
    );
    await assert.rejects(
      db.exec(`update apps set featured_order=-1 where id='${app}'`),
    );
    await assert.rejects(
      db.exec(`update apps set tagline=repeat('x',201) where id='${app}'`),
    );
    await assert.rejects(
      db.exec(`update categories set sort_order=-1 where id='${cat}'`),
    );
    await identity(db, "anon", "");
    assert.equal(
      (await db.query(`select * from app_media where app_id='${app}'`)).rows
        .length,
      0,
    );
  } finally {
    await db.close();
  }
});

test("all catalog writes require admin, even when customers can read the published rows", async () => {
  const db = await setup();
  try {
    const { seedCatalogFixture } = await import("../helpers/catalog-fixtures");
    await seedCatalogFixture(db);
    const ids = (
      await db.query<{
        app_id: string;
        category_id: string;
        plan_id: string;
        media_id: string;
      }>(
        `select a.id app_id,a.category_id,p.id plan_id,m.id media_id from apps a join plans p on p.app_id=a.id join app_media m on m.app_id=a.id where a.slug='alat-sertifikat-uji' limit 1`,
      )
    ).rows[0];
    for (const role of ["anon", "authenticated"]) {
      await identity(db, role, role === "anon" ? "" : customer);
      assert.equal((await db.query("select * from apps")).rows.length, 2);
      for (const table of ["categories", "apps", "app_media", "plans"]) {
        const column =
          table === "apps"
            ? "name"
            : table === "categories"
              ? "name"
              : table === "plans"
                ? "name"
                : "alt_text";
        if (role === "anon")
          await assert.rejects(
            db.exec(`update ${table} set ${column}='Unauthorized'`),
          );
        else
          assert.equal(
            (
              await db.query(
                `update ${table} set ${column}='Unauthorized' returning id`,
              )
            ).rows.length,
            0,
          );
        if (role === "anon")
          await assert.rejects(db.exec(`delete from ${table}`));
        else
          assert.equal(
            (await db.query(`delete from ${table} returning id`)).rows.length,
            0,
          );
      }
      await assert.rejects(
        db.exec(
          `insert into categories(slug,name) values('unauthorized','Unauthorized')`,
        ),
      );
      await assert.rejects(
        db.exec(
          `insert into apps(slug,name) values('unauthorized','Unauthorized')`,
        ),
      );
      await assert.rejects(
        db.exec(
          `insert into plans(app_id,name,billing_type,price_idr) values('${ids.app_id}','Unauthorized','free',0)`,
        ),
      );
      await assert.rejects(
        db.exec(
          `insert into app_media(app_id,kind,youtube_id,alt_text) values('${ids.app_id}','youtube','dQw4w9WgXcQ','Unauthorized')`,
        ),
      );
      await assert.rejects(
        db.exec(`insert into admin_members(user_id) values('${customer}')`),
      );
    }
    await identity(db);
    assert.equal((await db.query("select * from apps")).rows.length, 4);
    await db.exec(
      `update categories set name='Updated by admin' where id='${ids.category_id}'`,
    );
    assert.equal(
      (
        await db.query<{ name: string }>(
          `select name from categories where id='${ids.category_id}'`,
        )
      ).rows[0].name,
      "Updated by admin",
    );
  } finally {
    await db.close();
  }
});

test("settings and media: admin-only writes, private actors, immutable published files and atomic replacement", async () => {
  const db = await setup();
  try {
    await identity(db);
    const cat = (
      await db.query<{ id: string }>("select id from categories limit 1")
    ).rows[0].id;
    const p = payload(cat);
    await save(db, { ...p, key_features: ["Fitur utama"] });
    const path2 = `${app}/55555555-5555-4555-8555-555555555555.png`;
    await db.exec(
      `insert into storage.objects(bucket_id,name) values('app-media','${path}'),('app-media','${path2}')`,
    );
    const first = await db.query<{ id: string }>(
      "select save_catalog_media($1::jsonb) as id",
      [
        JSON.stringify({
          app_id: app,
          kind: "thumbnail",
          storage_path: path,
          alt_text: "Original",
          sort_order: 0,
        }),
      ],
    );
    const id = first.rows[0].id;
    await db.query("select save_catalog_media($1::jsonb)", [
      JSON.stringify({
        id,
        app_id: app,
        kind: "thumbnail",
        storage_path: path2,
        alt_text: "Replacement",
        sort_order: 0,
      }),
    ]);
    assert.equal(
      (
        await db.query<{ storage_path: string }>(
          `select storage_path from app_media where id='${id}'`,
        )
      ).rows[0].storage_path,
      path2,
    );
    const revision = (
      await db.query<{ revision: number }>(
        `select revision from apps where id='${app}'`,
      )
    ).rows[0].revision;
    await save(db, {
      ...p,
      revision,
      status: "published",
      is_visible: true,
      key_features: ["Fitur utama"],
    });
    assert.equal(
      (
        await db.query(
          `delete from storage.objects where name='${path}' returning id`,
        )
      ).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query(
          `delete from storage.objects where name='${path2}' returning id`,
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.query("select save_catalog_media($1::jsonb)", [
        JSON.stringify({
          id,
          app_id: app,
          kind: "thumbnail",
          storage_path: path,
          alt_text: "Forbidden",
          sort_order: 0,
        }),
      ]),
    );
    await db.query("select save_site_settings($1::jsonb)", [
      JSON.stringify({
        site_name: "Test Studio",
        tagline: "by Studio",
        support_email: "",
        support_whatsapp: "",
      }),
    ]);
    assert.ok(
      (
        await db.query(
          `select * from audit_logs where entity_type='site_settings' and actor_id='${admin}'`,
        )
      ).rows.length > 0,
    );
    await identity(db, "authenticated", customer);
    assert.equal(
      (
        await db.query(
          `update site_settings set value='Hacked' where key='site_name' returning key`,
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.exec(`insert into site_settings(key,value) values('secret','bad')`),
    );
    await assert.rejects(
      db.query("select save_site_settings($1::jsonb)", [
        JSON.stringify({
          site_name: "Hack",
          tagline: "Hack",
          support_email: "",
          support_whatsapp: "",
        }),
      ]),
    );
    await identity(db, "anon", "");
    assert.equal(
      (await db.query("select key,value from site_settings")).rows.length,
      11,
    );
    await assert.rejects(db.query("select updated_by from site_settings"));
  } finally {
    await db.close();
  }
});
