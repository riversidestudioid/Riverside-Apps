import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { verifyAdmin, safeAdminPath } from "./session";
export async function requireAdmin(next = "/admin") {
  if (!hasSupabaseEnv()) redirect("/login?status=setup");
  const supabase = await createClient();
  const result = await verifyAdmin(supabase);
  if (result.status === "unavailable")
    throw new Error("Akses admin belum dapat diverifikasi. Coba lagi.");
  if (result.status !== "admin")
    redirect(
      "/login?status=" +
        (result.status === "forbidden" ? "forbidden" : "expired") +
        "&next=" +
        encodeURIComponent(safeAdminPath(next)),
    );
  return { supabase, user: result.user };
}
