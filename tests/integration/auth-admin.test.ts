import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "../../src/lib/supabase/database";
import { verifyAdmin } from "../../src/lib/admin/session";
import { persistApp } from "../../src/lib/admin/app-repository";
import { createCatalogApi } from "../helpers/catalog-api";
import { admin } from "../helpers/database";

test("signed JWT claims + live membership: rejects spoofed metadata, forged/expired tokens and revoked admins", async () => {
  const api = await createCatalogApi();
  try {
    const make = () =>
      createClient<Database>(api.url, "test-only-key", {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    const a = make(),
      c = make();
    assert.equal((await verifyAdmin(a)).status, "unauthenticated");
    assert.ok(
      (
        await a.auth.signInWithPassword({
          email: api.auth.credentials.admin,
          password: "wrong-input",
        })
      ).error,
    );
    await a.auth.signInWithPassword({
      email: api.auth.credentials.admin,
      password: api.auth.credentials.password,
    });
    assert.equal((await verifyAdmin(a)).status, "admin");
    await c.auth.signInWithPassword({
      email: api.auth.credentials.customer,
      password: api.auth.credentials.password,
    });
    assert.equal((await verifyAdmin(c)).status, "forbidden");
    assert.ok(
      (
        await c
          .from("admin_members")
          .insert({ user_id: "22222222-2222-4222-8222-222222222222" })
      ).error,
    );
    const valid = api.auth.issue(admin).access_token;
    const parts = valid.split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    payload.sub = "22222222-2222-4222-8222-222222222222";
    const forged =
      parts[0] +
      "." +
      Buffer.from(JSON.stringify(payload)).toString("base64url") +
      "." +
      parts[2];
    assert.ok((await a.auth.getClaims(forged)).error);
    assert.ok(
      (await a.auth.getClaims(api.auth.issue(admin, -30).access_token)).error,
    );
    await api.db.exec("reset role;delete from admin_members");
    assert.equal((await verifyAdmin(a)).status, "forbidden");
  } finally {
    await api.close();
  }
});

test("SSR cookies survive a server request, refresh and logout; customer direct RPC/Storage writes fail", async () => {
  const api = await createCatalogApi();
  try {
    const jar = new Map<string, string>();
    const make = () =>
      createServerClient<Database>(api.url, "test-only-key", {
        cookies: {
          getAll: () => [...jar].map(([name, value]) => ({ name, value })),
          setAll(values) {
            for (const { name, value, options } of values) {
              if (options.maxAge === 0) jar.delete(name);
              else jar.set(name, value);
            }
          },
        },
      });
    const db = make();
    await db.auth.signInWithPassword({
      email: api.auth.credentials.admin,
      password: api.auth.credentials.password,
    });
    assert.ok(jar.size > 0);
    assert.equal((await verifyAdmin(make())).status, "admin");
    assert.ok((await db.auth.refreshSession()).data.session);
    await db.auth.signOut({ scope: "local" });
    assert.equal((await verifyAdmin(make())).status, "unauthenticated");
    const c = createClient<Database>(api.url, "test-only-key", {
      auth: { persistSession: false },
    });
    await c.auth.signInWithPassword({
      email: api.auth.credentials.customer,
      password: api.auth.credentials.password,
    });
    assert.ok(
      (
        await c.rpc("save_catalog_media", {
          payload: {
            app_id: "33333333-3333-4333-8333-333333333333",
            kind: "youtube",
            youtube_id: "dQw4w9WgXcQ",
            alt_text: "Attempt",
            sort_order: 0,
          },
        })
      ).error,
    );
    assert.ok(
      (
        await c.storage
          .from("app-media")
          .upload(
            "33333333-3333-4333-8333-333333333333/55555555-5555-4555-8555-555555555555.png",
            new Blob(["bad"], { type: "image/png" }),
          )
      ).error,
    );
    const adminClient = createClient<Database>(api.url, "test-only-key", {
      auth: { persistSession: false },
    });
    await adminClient.auth.signInWithPassword({
      email: api.auth.credentials.admin,
      password: api.auth.credentials.password,
    });
    const { data: category } = await adminClient
      .from("categories")
      .select("*")
      .eq("slug", "pendidikan")
      .maybeSingle();
    const input = {
      id: crypto.randomUUID(),
      revision: 0,
      slug: "admin-integration",
      name: "Admin Integration",
      tagline: "",
      description: "Aplikasi pengujian admin dan katalog.",
      short_description: "",
      key_features: ["Fitur dari database"],
      category_id: category!.id,
      platform: "web",
      status: "draft",
      is_visible: false,
      is_featured: false,
      featured_order: 0,
      demo_url: "",
      launch_url: "",
      plans: [],
    };
    const result = await persistApp(adminClient, input);
    assert.ok(result.ok);
    assert.ok(
      (
        await persistApp(c, {
          ...input,
          id: crypto.randomUUID(),
          slug: "customer-attempt",
        })
      ).error,
    );
    const row = await adminClient
      .from("apps")
      .select("*")
      .eq("id", input.id)
      .maybeSingle();
    assert.deepEqual(row.data?.key_features, ["Fitur dari database"]);
    assert.ok(
      (
        await adminClient.rpc("save_site_settings", {
          payload: {
            site_name: "Studio Test",
            tagline: "by Studio",
            support_email: "",
            support_whatsapp: "",
          },
        })
      ).error === null,
    );
    assert.ok(
      (
        await c.rpc("save_site_settings", {
          payload: {
            site_name: "Hacked",
            tagline: "bad",
            support_email: "",
            support_whatsapp: "",
          },
        })
      ).error,
    );
  } finally {
    await api.close();
  }
});
