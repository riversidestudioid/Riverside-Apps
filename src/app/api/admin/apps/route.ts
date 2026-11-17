import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/admin/session";
import { persistApp } from "@/lib/admin/app-repository";
import { revalidatePath } from "next/cache";
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
async function context() {
  if (!hasSupabaseEnv())
    return { denied: json({ error: "Login belum tersedia." }, 503) };
  const db = await createClient();
  const identity = await verifyAdmin(db);
  if (identity.status !== "admin")
    return {
      denied: json(
        { error: "Akses admin diperlukan." },
        identity.status === "forbidden"
          ? 403
          : identity.status === "unavailable"
            ? 503
            : 401,
      ),
    };
  return { db };
}
export async function GET() {
  const c = await context();
  if (c.denied) return c.denied;
  const { data, error } = await c
    .db!.from("apps")
    .select("id,name,slug,status")
    .order("name");
  return error
    ? json({ error: "Data belum dapat dimuat." }, 503)
    : json({ apps: data });
}
export async function POST(request: NextRequest) {
  const c = await context();
  if (c.denied) return c.denied;
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return json({ error: "Origin tidak diizinkan." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return json({ error: "Gunakan JSON." }, 415);
  const text = await request.text();
  if (text.length > 256000)
    return json({ error: "Payload terlalu besar." }, 413);
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return json({ error: "JSON tidak valid." }, 400);
  }
  const result = await persistApp(c.db!, input);
  if (result.error) return json(result, 400);
  revalidatePath("/");
  revalidatePath("/apps");
  revalidatePath("/admin/apps");
  return json(result);
}
