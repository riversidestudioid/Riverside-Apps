/** Opt-in, local-only Supabase verification. Never reads application/remote env. */
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const status = JSON.parse(
    execFileSync("supabase", ["status", "-o", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
  const endpoint = new URL(status.API_URL);
  assert.ok(
    ["127.0.0.1", "localhost"].includes(endpoint.hostname),
    "Refusing non-local Supabase",
  );
  assert.equal(endpoint.protocol, "http:");
  assert.equal(endpoint.port, "54321");
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const owner = createClient(endpoint.href, status.SERVICE_ROLE_KEY, options);
  const anon = createClient(endpoint.href, status.ANON_KEY, options);
  const admin = createClient(endpoint.href, status.ANON_KEY, options);
  const customer = createClient(endpoint.href, status.ANON_KEY, options);
  const password = randomBytes(24).toString("base64url");
  const suffix = randomUUID();
  const users: string[] = [];
  const categoryId = randomUUID(),
    appId = randomUUID();
  const paths: string[] = [];
  const sql = (query: string) =>
    execFileSync(
      "docker",
      [
        "exec",
        "supabase_db_riverside-apps-local",
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        query,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
  const ok = (result: { error: unknown }) => assert.equal(result.error, null);
  try {
    for (const name of ["admin", "customer"]) {
      const result = await owner.auth.admin.createUser({
        email: `${name}-${suffix}@example.test`,
        password,
        email_confirm: true,
        user_metadata: { role: "admin" },
      });
      ok(result);
      users.push(result.data.user!.id);
    }
    // SQL owner only: membership is never self-assigned through the customer API.
    sql(`insert into public.admin_members(user_id) values ('${users[0]}')`);
    const email = (name: string) => `${name}-${suffix}@example.test`;
    assert.ok(
      (
        await admin.auth.signInWithPassword({
          email: email("admin"),
          password: "incorrect-password",
        })
      ).error,
    );
    ok(
      await admin.auth.signInWithPassword({ email: email("admin"), password }),
    );
    ok(
      await customer.auth.signInWithPassword({
        email: email("customer"),
        password,
      }),
    );
    ok(await admin.auth.getClaims());
    const oldRefresh = (await admin.auth.getSession()).data.session!
      .refresh_token;
    ok(await admin.auth.refreshSession({ refresh_token: oldRefresh }));
    assert.ok(
      (await customer.from("admin_members").insert({ user_id: users[1] }))
        .error,
    );
    assert.equal(
      (await customer.from("admin_members").select("user_id")).data?.length,
      0,
    );
    ok(
      await admin
        .from("categories")
        .insert({
          id: categoryId,
          name: "Real verification",
          slug: `real-${suffix}`,
        }),
    );
    assert.ok(
      (
        await customer
          .from("categories")
          .insert({ name: "Forbidden", slug: `forbidden-${suffix}` })
      ).error,
    );
    ok(
      await admin
        .from("apps")
        .insert({
          id: appId,
          name: "Real Supabase test",
          slug: `real-${suffix}`,
          category_id: categoryId,
          description: "Local integration verification",
          launch_url: "https://example.test/app",
        }),
    );
    assert.equal(
      (await anon.from("apps").select("id").eq("id", appId)).data?.length,
      0,
    );
    assert.equal(
      (
        await customer
          .from("apps")
          .update({ name: "Hijacked" })
          .eq("id", appId)
          .select("id")
      ).data?.length,
      0,
    );
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7S8AAAAASUVORK5CYII=",
      "base64",
    );
    const path = `${appId}/${randomUUID()}.png`;
    paths.push(path);
    assert.ok(
      (
        await customer.storage
          .from("app-media")
          .upload(`${appId}/${randomUUID()}.png`, png, {
            contentType: "image/png",
          })
      ).error,
    );
    assert.ok(
      (
        await admin.storage
          .from("app-media")
          .upload(`${appId}/${randomUUID()}.svg`, Buffer.from("<svg/>"), {
            contentType: "image/svg+xml",
          })
      ).error,
    );
    ok(
      await admin.storage
        .from("app-media")
        .upload(path, png, { contentType: "image/png" }),
    );
    ok(await admin.storage.from("app-media").info(path));
    ok(
      await admin
        .from("app_media")
        .insert({ app_id: appId, kind: "thumbnail", storage_path: path }),
    );
    ok(
      await admin
        .from("plans")
        .insert({
          app_id: appId,
          name: "Free test",
          billing_type: "free",
          price_idr: 0,
          license_policy: "Local verification",
        }),
    );
    ok(
      await admin
        .from("apps")
        .update({ status: "published", is_visible: true })
        .eq("id", appId),
    );
    assert.equal(
      (await anon.from("apps").select("id").eq("id", appId)).data?.length,
      1,
    );
    const signed = await anon.storage
      .from("app-media")
      .createSignedUrl(path, 60);
    ok(signed);
    assert.equal((await fetch(signed.data!.signedUrl)).status, 200);
    await admin.storage.from("app-media").remove([path]);
    ok(await admin.storage.from("app-media").info(path)); // published referenced object survives delete
    ok(await admin.from("apps").update({ status: "archived" }).eq("id", appId));
    assert.equal(
      (await anon.from("apps").select("id").eq("id", appId)).data?.length,
      0,
    );
    ok(
      await admin
        .from("apps")
        .update({ status: "draft", name: "Edited locally" })
        .eq("id", appId),
    );
    ok(await admin.from("app_media").delete().eq("app_id", appId));
    ok(await admin.storage.from("app-media").remove([path]));
    assert.ok((await admin.storage.from("app-media").info(path)).error);
    ok(await admin.from("apps").delete().eq("id", appId));
    const refresh = (await admin.auth.getSession()).data.session!.refresh_token;
    ok(await admin.auth.signOut());
    assert.ok(
      (await admin.auth.refreshSession({ refresh_token: refresh })).error,
    );
    console.log(
      "PASS: real local Auth, refresh/logout, PostgREST CRUD, RLS, Storage and publication isolation",
    );
  } finally {
    // Clean only uniquely identified fixtures; never reset a database.
    await owner.from("apps").delete().eq("id", appId);
    if (paths.length) await owner.storage.from("app-media").remove(paths);
    await owner.from("categories").delete().eq("id", categoryId);
    for (const id of users) await owner.auth.admin.deleteUser(id);
  }
}
main().catch(() => {
  console.error(
    "FAIL: local Supabase preflight or verification failed; check runtime, stack health, and local migrations. No credentials logged.",
  );
  process.exitCode = 1;
});
