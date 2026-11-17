"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import {
  logoPathPattern,
  settingsSchema,
} from "@/lib/admin/settings-validation";
import { matchesFileSignature } from "@/lib/admin/media-validation";

const logoTypes: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const maxLogoBytes = 2 * 1024 * 1024;

export async function saveSettings(input: unknown) {
  const { supabase } = await requireAdmin("/admin/settings");
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  // The logo is changed only through saveLogo/removeLogo, which verify the stored file.
  const { logo_path: _ignored, ...values } = parsed.data;
  void _ignored;
  const { error } = await supabase.rpc("save_site_settings", {
    payload: values,
  });
  if (error) return { error: "Pengaturan belum dapat disimpan." };
  revalidatePath("/", "layout");
  return { ok: true };
}

async function currentLogo(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
) {
  const { data } = await supabase
    .from("site_settings")
    .select("key,value")
    .eq("key", "logo_path")
    .maybeSingle();
  return data?.value ?? "";
}

export async function saveLogo(path: string) {
  const { supabase } = await requireAdmin("/admin/settings");
  if (typeof path !== "string" || !logoPathPattern.test(path))
    return { error: "Path logo tidak valid." };
  const storage = supabase.storage.from("site-assets");
  const { data: info, error: infoError } = await storage.info(path);
  const type = info?.contentType ?? "";
  if (infoError || !info || !logoTypes[type])
    return { error: "File logo belum tersedia atau formatnya tidak didukung." };
  if (!path.endsWith("." + logoTypes[type]) || (info.size ?? 0) > maxLogoBytes)
    return { error: "Logo harus PNG/JPG/WebP dengan ukuran maksimal 2 MB." };
  const { data: file, error: downloadError } = await storage.download(path);
  if (
    downloadError ||
    !file ||
    !matchesFileSignature(
      new Uint8Array(await file.slice(0, 32).arrayBuffer()),
      type,
    )
  ) {
    await storage.remove([path]);
    return { error: "Isi file tidak sesuai dengan format gambar yang diizinkan." };
  }
  const previous = await currentLogo(supabase);
  const { data: updated, error } = await supabase
    .from("site_settings")
    .update({ value: path })
    .eq("key", "logo_path")
    .select("key");
  if (error || !updated?.length) {
    await storage.remove([path]);
    return { error: "Logo belum dapat disimpan." };
  }
  if (previous && previous !== path) await storage.remove([previous]);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeLogo() {
  const { supabase } = await requireAdmin("/admin/settings");
  const previous = await currentLogo(supabase);
  const { error } = await supabase
    .from("site_settings")
    .update({ value: "" })
    .eq("key", "logo_path")
    .select("key");
  if (error) return { error: "Logo belum dapat dihapus." };
  if (previous) await supabase.storage.from("site-assets").remove([previous]);
  revalidatePath("/", "layout");
  return { ok: true };
}
