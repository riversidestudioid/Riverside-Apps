import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database";
import { appSchema } from "@/lib/catalog/validation";
export async function persistApp(db: SupabaseClient<Database>, input: unknown) {
  const parsed = appSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  const { data, error } = await db.rpc("save_catalog_app", {
    payload: parsed.data as Json,
  });
  if (error)
    return {
      error:
        error.code === "40001"
          ? "Data berubah di sesi lain. Muat ulang sebelum menyimpan."
          : error.code === "23505"
            ? "Slug sudah dipakai."
            : "Belum dapat menyimpan. Periksa kelengkapan kategori, thumbnail, URL aplikasi, harga, dan lisensi sebelum publikasi.",
    };
  return { ok: true, id: data };
}
