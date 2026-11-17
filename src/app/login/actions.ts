"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { verifyAdmin, safeAdminPath } from "@/lib/admin/session";
import { z } from "zod";
export async function login(_previous: { error: string }, form: FormData) {
  if (!hasSupabaseEnv()) return { error: "Supabase belum dikonfigurasi." };
  const parsed = z
    .object({ email: z.email().max(254), password: z.string().min(1).max(128) })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Periksa email dan kata sandi." };
  const db = await createClient();
  let success = false;
  try {
    const { error } = await db.auth.signInWithPassword(parsed.data);
    if (error)
      return { error: "Login gagal. Periksa kredensial atau coba lagi nanti." };
    const session = await verifyAdmin(db);
    if (session.status !== "admin") {
      await db.auth.signOut({ scope: "local" });
      return {
        error:
          session.status === "forbidden"
            ? "Akun ini tidak memiliki akses admin."
            : "Sesi belum dapat diverifikasi. Silakan masuk kembali.",
      };
    }
    success = true;
  } catch {
    return {
      error: "Layanan login belum dapat dihubungi. Silakan coba kembali.",
    };
  }
  if (success) redirect(safeAdminPath(form.get("next")));
  return { error: "Login gagal." };
}
export async function logout() {
  if (hasSupabaseEnv()) {
    const db = await createClient();
    await db.auth.signOut({ scope: "local" });
  }
  redirect("/login?status=logged-out");
}
