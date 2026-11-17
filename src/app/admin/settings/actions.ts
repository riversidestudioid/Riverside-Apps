"use server";
import { requireAdmin } from "@/lib/admin/auth";
import { settingsSchema } from "@/lib/admin/settings-validation";
import { revalidatePath } from "next/cache";
export async function saveSettings(input: unknown) {
  const { supabase } = await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  const { error } = await supabase.rpc("save_site_settings", {
    payload: parsed.data,
  });
  if (error) return { error: "Pengaturan belum dapat disimpan." };
  revalidatePath("/", "layout");
  return { ok: true };
}
