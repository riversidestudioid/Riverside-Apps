import { verifyAdmin } from "@/lib/admin/session";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success || !hasSupabaseEnv())
    return new NextResponse(null, { status: 404 });
  let db = createPublicClient();
  if (request.nextUrl.searchParams.get("preview") === "1") {
    const session = await createClient();
    const identity = await verifyAdmin(session);
    if (identity.status !== "admin")
      return new NextResponse(null, { status: 404 });
    db = session;
  }
  const { data: media, error } = await db
    .from("app_media")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (error || !media?.storage_path)
    return new NextResponse(null, { status: 404 });
  const { data, error: signError } = await db.storage
    .from("app-media")
    .createSignedUrl(media.storage_path, 60);
  if (signError || !data) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(data.signedUrl, {
    status: 307,
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
