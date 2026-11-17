import { createTestAuth, readJson } from "./auth-fixture";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import type { AddressInfo } from "node:net";
import { createTestDatabase } from "./database";
import { seedCatalogFixture } from "./catalog-fixtures";
// A small test-only HTTP adapter for the PostgREST requests used by the repository.
// SQL filtering and RLS execute in PostgreSQL, not in JavaScript. Not a Supabase service emulator.
export async function createCatalogApi() {
  const db = await createTestDatabase();
  await seedCatalogFixture(db);
  let fail = false;
  let origin = "";
  const auth = createTestAuth(() => origin);
  const files = new Map<string, { bytes: Uint8Array; type: string }>();
  let queue = Promise.resolve();
  async function handle(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const requestOrigin = req.headers.origin;
    if (requestOrigin && /^http:\/\/127\.0\.0\.1:\d+$/.test(requestOrigin)) {
      res.setHeader("Access-Control-Allow-Origin", requestOrigin);
      res.setHeader(
        "Access-Control-Allow-Headers",
        req.headers["access-control-request-headers"] ??
          "authorization,apikey,content-type,x-client-info,x-upsert",
      );
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PATCH,DELETE,OPTIONS",
      );
    }
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    const json = (value: unknown, status = 200) => {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(value));
    };
    if (await auth.handle(req, url, json)) return;
    if (url.pathname === "/__test/revoke-admin" && req.method === "POST") {
      await db.exec("reset role;delete from admin_members");
      return json({ ok: true });
    }
    if (url.pathname === "/__test/restore-admin" && req.method === "POST") {
      await db.exec(
        "reset role;insert into admin_members(user_id) values('11111111-1111-4111-8111-111111111111') on conflict do nothing",
      );
      return json({ ok: true });
    }
    if (url.pathname === "/health") return json({ ok: true });
    if (url.pathname === "/__test/failure" && req.method === "POST") {
      fail = url.searchParams.get("enabled") === "1";
      return json({ ok: true });
    }
    if (url.pathname === "/__test/empty" && req.method === "POST") {
      await db.exec(
        "reset role;update apps set status='draft',is_visible=false where status='published'",
      );
      return json({ ok: true });
    }
    if (url.pathname === "/__test/reset" && req.method === "POST") {
      await db.exec(
        "reset role;truncate apps cascade;truncate storage.objects;",
      );
      await seedCatalogFixture(db);
      fail = false;
      return json({ ok: true });
    }
    if (fail)
      return json(
        { message: "Internal test database unavailable", code: "XX000" },
        503,
      );
    try {
      const bearer = (req.headers.authorization ?? "").replace("Bearer ", "");
      const identity = auth.claims(bearer);
      if (bearer.split(".").length === 3 && !identity)
        return json({ message: "Invalid JWT" }, 401);
      await db.exec(
        `reset role;set role ${identity ? "authenticated" : "anon"};select set_config('request.jwt.claim.sub','${identity?.sub ?? ""}',false)`,
      );
      if (url.pathname === "/rest/v1/rpc/catalog_apps") {
        let body = "";
        for await (const chunk of req) body += chunk;
        const p = JSON.parse(body || "{}");
        const { rows } = await db.query<{ result: unknown }>(
          "select public.catalog_apps($1,$2,$3,$4,$5,$6,$7) as result",
          [
            p.p_query ?? "",
            p.p_category ?? "",
            p.p_billing ?? "",
            p.p_sort ?? "featured",
            p.p_page ?? 1,
            p.p_page_size ?? 24,
            p.p_featured ?? false,
          ],
        );
        return json(rows[0].result);
      }
      if (
        url.pathname === "/rest/v1/rpc/save_catalog_app" ||
        url.pathname === "/rest/v1/rpc/save_catalog_media" ||
        url.pathname === "/rest/v1/rpc/save_site_settings"
      ) {
        const body = await readJson(req);
        const fn = url.pathname.split("/").pop()!;
        const { rows } = await db.query<{ result: unknown }>(
          `select public.${fn}($1::jsonb) as result`,
          [JSON.stringify(body.payload)],
        );
        return json(rows[0].result);
      }
      if (url.pathname === "/storage/v1/object/list/app-media") {
        const body = await readJson(req);
        const prefix = String(body.prefix ?? "");
        const { rows } = await db.query<{ id: string; name: string }>(
          "select id,name from storage.objects where bucket_id=$1 and name like $2",
          ["app-media", prefix.replace(/\/$/, "") + "/%"],
        );
        return json(
          rows.map((row) => ({
            ...row,
            name: row.name.split("/").pop(),
            metadata: {},
          })),
        );
      }
      if (
        url.pathname === "/storage/v1/object/app-media" &&
        req.method === "DELETE"
      ) {
        const body = await readJson(req);
        const paths = body.prefixes as string[];
        const result = [];
        for (const path of paths) {
          const { rows } = await db.query(
            "delete from storage.objects where bucket_id=$1 and name=$2 returning id,name",
            ["app-media", path],
          );
          result.push(...rows);
          if (rows.length) files.delete(path);
        }
        return json(result);
      }
      const infoPrefix = "/storage/v1/object/info/app-media/";
      if (url.pathname.startsWith(infoPrefix)) {
        const path = decodeURIComponent(url.pathname.slice(infoPrefix.length));
        const { rows } = await db.query<{ id: string; name: string }>(
          "select id,name from storage.objects where bucket_id=$1 and name=$2",
          ["app-media", path],
        );
        if (!rows.length) return json({ message: "Not found" }, 404);
        const f = files.get(path);
        return json({
          ...rows[0],
          bucket_id: "app-media",
          content_type: f?.type ?? "image/png",
          size: f?.bytes.length ?? 68,
        });
      }
      const uploadPrefix = "/storage/v1/object/app-media/";
      if (url.pathname.startsWith(uploadPrefix) && req.method === "POST") {
        const path = decodeURIComponent(
          url.pathname.slice(uploadPrefix.length),
        );
        const chunks = [];
        for await (const chunk of req) chunks.push(Buffer.from(chunk));
        const bytes = Buffer.concat(chunks);
        const form = await new Response(new Uint8Array(bytes), {
          headers: { "Content-Type": String(req.headers["content-type"]) },
        }).formData();
        const file = [...form.values()].find((v) => v instanceof File) as
          File | undefined;
        if (!file) return json({ message: "File required" }, 400);
        const { rows } = await db.query(
          "insert into storage.objects(bucket_id,name) values($1,$2) returning id",
          ["app-media", path],
        );
        files.set(path, {
          bytes: new Uint8Array(await file.arrayBuffer()),
          type: file.type,
        });
        return json({
          Id: (rows[0] as { id: string }).id,
          Key: "app-media/" + path,
        });
      }
      if (
        (url.pathname.startsWith(uploadPrefix) ||
          url.pathname.startsWith(
            "/storage/v1/object/authenticated/app-media/",
          )) &&
        req.method === "GET"
      ) {
        const path = decodeURIComponent(
          url.pathname.replace(
            /^\/storage\/v1\/object\/(authenticated\/)?app-media\//,
            "",
          ),
        );
        const { rows } = await db.query(
          "select id from storage.objects where bucket_id=$1 and name=$2",
          ["app-media", path],
        );
        if (!rows.length) return json({ message: "Not found" }, 404);
        const file = files.get(path);
        res.writeHead(200, { "Content-Type": file?.type ?? "image/png" });
        res.end(
          file?.bytes ??
            Buffer.from(
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7S8AAAAASUVORK5CYII=",
              "base64",
            ),
        );
        return;
      }
      const prefix = "/storage/v1/object/sign/app-media/";
      if (url.pathname.startsWith(prefix)) {
        const path = decodeURIComponent(url.pathname.slice(prefix.length));
        const { rows } = await db.query(
          "select id from storage.objects where bucket_id=$1 and name=$2",
          ["app-media", path],
        );
        if (!rows.length) return json({ message: "Not found" }, 404);
        if (req.method === "POST")
          return json({
            signedURL: "/object/sign/app-media/" + path + "?token=test-only",
          });
        res.writeHead(200, {
          "Content-Type": "image/png",
          "Cache-Control": "no-store",
        });
        res.end(
          Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7S8AAAAASUVORK5CYII=",
            "base64",
          ),
        );
        return;
      }
      const table = url.pathname.replace("/rest/v1/", "");
      const allowed: Record<string, string[]> = {
        apps: ["id", "slug", "status", "is_visible"],
        categories: ["id", "slug", "is_active"],
        app_media: ["id", "app_id", "kind", "storage_path"],
        plans: ["id", "app_id", "is_active"],
        admin_members: ["user_id"],
        site_settings: ["id", "key"],
      };
      if (!allowed[table])
        return json({ message: "Not available in test API" }, 404);
      const clauses: string[] = [];
      const args: unknown[] = [];
      for (const [column, filter] of url.searchParams) {
        if (["select", "order", "limit"].includes(column)) continue;
        if (!allowed[table].includes(column) || !/^(eq|neq)\./.test(filter))
          throw Error("Unsupported test filter");
        const neq = filter.startsWith("neq.");
        args.push(filter.slice(neq ? 4 : 3));
        clauses.push(`"${column}" ${neq ? "<>" : "="} $${args.length}`);
      }
      let order = "";
      const sort = url.searchParams.get("order");
      if (sort) {
        const fields = sort.split(",").map((field) => {
          const [column, direction] = field.split(".");
          if (
            !/^(sort_order|name|id|price_idr|updated_at|created_at)$/.test(
              column,
            ) ||
            !["asc", "desc"].includes(direction)
          )
            throw Error("Unsupported test order");
          return `"${column}" ${direction}`;
        });
        order = " order by " + fields.join(",");
      }
      const where = clauses.length ? " where " + clauses.join(" and ") : "";
      let result;
      if (req.method === "POST" || req.method === "PATCH") {
        const body = await readJson(req);
        const allowedWrite: Record<string, string[]> = {
          apps: [
            "name",
            "slug",
            "tagline",
            "description",
            "short_description",
            "category_id",
            "platform",
            "status",
            "is_visible",
            "is_featured",
            "featured_order",
            "demo_url",
            "launch_url",
            "key_features",
          ],
          categories: ["slug", "name", "icon", "sort_order", "is_active"],
          admin_members: ["user_id"],
          app_media: [
            "app_id",
            "kind",
            "storage_path",
            "youtube_id",
            "alt_text",
            "sort_order",
          ],
        };
        const columns = Object.keys(body);
        if (
          !columns.length ||
          columns.some((c) => !allowedWrite[table]?.includes(c))
        )
          return json({ message: "Invalid fields" }, 400);
        if (req.method === "POST")
          result = await db.query(
            `insert into public."${table}" (${columns.map((c) => `"${c}"`).join(",")}) values (${columns.map((_, i) => "$" + (i + 1)).join(",")}) returning *`,
            Object.values(body),
          );
        else {
          const n = args.length;
          result = await db.query(
            `update public."${table}" set ${columns.map((c, i) => `"${c}"=$${n + i + 1}`).join(",")}${where} returning *`,
            [...args, ...Object.values(body)],
          );
        }
      } else if (req.method === "DELETE")
        result = await db.query(
          `delete from public."${table}"${where} returning *`,
          args,
        );
      else
        result = await db.query(
          `select ${table === "site_settings" ? "key,value" : "*"} from public."${table}"${where}${order}`,
          args,
        );
      if (req.method === "HEAD") {
        res.writeHead(200, {
          "Content-Range": `0-${Math.max(0, result.rows.length - 1)}/${result.rows.length}`,
        });
        res.end();
        return;
      }
      if (req.headers.accept?.includes("application/vnd.pgrst.object+json"))
        return result.rows.length === 1
          ? json(result.rows[0])
          : json(
              { code: "PGRST116", details: "The result contains 0 rows" },
              406,
            );
      return json(result.rows);
    } catch (error) {
      return json(
        { message: error instanceof Error ? error.message : "Test SQL failed" },
        typeof error === "object" &&
          error &&
          "code" in error &&
          String(error.code) === "42501"
          ? 403
          : 500,
      );
    }
  }
  const server = createServer((req, res) => {
    queue = queue
      .then(() => handle(req, res))
      .catch(() => {
        res.writeHead(500);
        res.end();
      });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    db,
    url: origin,
    auth,
    close: async () => {
      await new Promise<void>((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      );
      await db.close();
    },
  };
}
