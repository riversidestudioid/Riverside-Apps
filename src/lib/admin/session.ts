import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";
import { z } from "zod";
export function safeAdminPath(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  )
    return "/admin";
  try {
    const u = new URL(value, "https://local.invalid");
    return u.origin === "https://local.invalid" &&
      (u.pathname === "/admin" || u.pathname.startsWith("/admin/"))
      ? u.pathname + u.search
      : "/admin";
  } catch {
    return "/admin";
  }
}
export type AdminIdentity = { id: string; email: string };
export type AdminSession =
  | { status: "admin"; user: AdminIdentity }
  | { status: "unauthenticated" | "forbidden" | "unavailable" };
export async function verifyAdmin(
  db: SupabaseClient<Database>,
): Promise<AdminSession> {
  try {
    const { data, error } = await db.auth.getClaims();
    const claims = data?.claims;
    if (
      error ||
      !claims ||
      !z.uuid().safeParse(claims.sub).success ||
      typeof claims.exp !== "number" ||
      claims.exp <= Date.now() / 1000
    )
      return { status: "unauthenticated" };
    const { data: member, error: roleError } = await db
      .from("admin_members")
      .select("user_id")
      .eq("user_id", claims.sub)
      .maybeSingle()
      .retry(false);
    if (roleError) return { status: "unavailable" };
    if (!member) return { status: "forbidden" };
    return {
      status: "admin",
      user: {
        id: claims.sub,
        email: typeof claims.email === "string" ? claims.email : "",
      },
    };
  } catch {
    return { status: "unauthenticated" };
  }
}
