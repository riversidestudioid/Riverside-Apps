"use server";
import { requireAdmin } from "./auth";
import { youtubeId } from "@/lib/catalog/validation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { persistApp } from "./app-repository";
import {
  validateMediaFile,
  storedPathValid,
  matchesFileSignature,
} from "./media-validation";
export type ActionResult = { error?: string; id?: string; ok?: boolean };
function refresh() {
  revalidatePath("/");
  revalidatePath("/apps");
  revalidatePath("/apps/[slug]", "page");
  revalidatePath("/admin");
  revalidatePath("/admin/apps");
  revalidatePath("/admin/media");
}
export async function saveApp(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const result = await persistApp(supabase, input);
  if (result.error) return result;
  refresh();
  return result;
}
export async function deleteApp(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { error: "ID tidak valid." };
  const { data: app } = await supabase
    .from("apps")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!app) return { error: "Aplikasi tidak ditemukan." };
  if (app.status === "published")
    return { error: "Ubah ke draft atau arsip sebelum menghapus." };
  const { data: media } = await supabase
    .from("app_media")
    .select("storage_path")
    .eq("app_id", id);
  const { data: deleted, error } = await supabase
    .from("apps")
    .delete()
    .eq("id", id)
    .neq("status", "published")
    .select("id");
  if (error || !deleted?.length)
    return { error: "Aplikasi belum dapat dihapus." };
  const paths = (media ?? []).flatMap((m) =>
    m.storage_path ? [m.storage_path] : [],
  );
  if (paths.length) {
    const { error: storageError } = await supabase.storage
      .from("app-media")
      .remove(paths);
    if (storageError) {
      refresh();
      return {
        ok: true,
        error:
          "Aplikasi dihapus. Beberapa file privat perlu dibersihkan melalui Supabase Storage.",
      };
    }
  }
  refresh();
  return { ok: true };
}
export async function addMedia(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = z
    .object({
      app_id: z.uuid(),
      kind: z.enum(["icon", "thumbnail", "screenshot", "video", "youtube"]),
      replace_id: z.uuid().nullable().optional(),
      original_name: z.string().max(255).optional(),
      storage_path: z.string().max(200).nullable(),
      youtube_url: z.string().max(2000).optional(),
      alt_text: z.string().trim().min(1).max(250),
      sort_order: z.number().int().min(0).max(10000),
    })
    .safeParse(input);
  if (!parsed.success) return { error: "Periksa input media." };
  const v = parsed.data;
  const { data: app } = await supabase
    .from("apps")
    .select("status")
    .eq("id", v.app_id)
    .maybeSingle();
  if (app?.status !== "draft")
    return { error: "Ubah aplikasi ke draft sebelum mengubah media." };
  let youtube_id: string | null = null;
  if (v.kind === "youtube") {
    youtube_id = youtubeId(v.youtube_url ?? "");
    if (!youtube_id || v.storage_path)
      return { error: "Tautan YouTube tidak valid." };
  } else {
    if (!v.storage_path || !v.storage_path.startsWith(v.app_id + "/"))
      return { error: "Path upload tidak valid." };
    const { data: info, error } = await supabase.storage
      .from("app-media")
      .info(v.storage_path);
    if (error || !info) return { error: "File belum tersedia di Storage." };
    const invalid = validateMediaFile(
      {
        name: v.original_name ?? "",
        type: info.contentType ?? "",
        size: info.size ?? 0,
      },
      v.kind,
    );
    if (invalid) return { error: invalid };
    if (!storedPathValid(v.storage_path, v.app_id, info.contentType ?? ""))
      return { error: "Tipe dan ekstensi Storage tidak sesuai." };
    const { data: file, error: downloadError } = await supabase.storage
      .from("app-media")
      .download(v.storage_path);
    if (downloadError || !file)
      return { error: "File belum dapat diverifikasi." };
    if (
      file.size !== (info.size ?? 0) ||
      !matchesFileSignature(
        new Uint8Array(await file.slice(0, 32).arrayBuffer()),
        info.contentType ?? "",
      )
    )
      return { error: "Isi file tidak sesuai dengan format yang diizinkan." };
  }
  let oldPath: string | null = null;
  if (v.replace_id) {
    const { data: old } = await supabase
      .from("app_media")
      .select("*")
      .eq("id", v.replace_id)
      .eq("app_id", v.app_id)
      .maybeSingle();
    if (!old || old.kind !== v.kind)
      return { error: "Media pengganti tidak valid." };
    oldPath = old.storage_path;
  }
  const { data: id, error } = await supabase.rpc("save_catalog_media", {
    payload: {
      id: v.replace_id ?? null,
      app_id: v.app_id,
      kind: v.kind,
      storage_path: v.storage_path,
      youtube_id,
      alt_text: v.alt_text,
      sort_order: v.sort_order,
    },
  });
  if (error)
    return {
      error:
        "Media belum dapat disimpan. Ikon dan thumbnail hanya boleh satu per aplikasi.",
    };
  if (oldPath && oldPath !== v.storage_path) {
    const { error: cleanupError } = await supabase.storage
      .from("app-media")
      .remove([oldPath]);
    if (cleanupError) {
      refresh();
      return {
        ok: true,
        id,
        error:
          "Media diganti. File lama masih privat dan perlu dibersihkan di Kelola Media.",
      };
    }
  }
  refresh();
  return { ok: true, id };
}
export async function removeMedia(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { error: "ID tidak valid." };
  const { data: m } = await supabase
    .from("app_media")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!m) return { error: "Media tidak ditemukan." };
  const { error } = await supabase.from("app_media").delete().eq("id", id);
  if (error)
    return { error: "Ubah aplikasi ke draft sebelum menghapus media." };
  if (m.storage_path) {
    const { error: storageError } = await supabase.storage
      .from("app-media")
      .remove([m.storage_path]);
    if (storageError) {
      refresh();
      return {
        ok: true,
        error: "Metadata dihapus; file privat perlu dibersihkan di Storage.",
      };
    }
  }
  refresh();
  return { ok: true };
}
export async function saveCategory(input: unknown): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const parsed = z
    .object({
      id: z.uuid().optional(),
      slug: z
        .string()
        .min(1)
        .max(80)
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
      name: z.string().trim().min(1).max(80),
      icon: z.enum([
        "grid",
        "church",
        "education",
        "business",
        "layers",
        "image",
        "code",
        "settings",
      ]),
      sort_order: z.number().int().min(0).max(1000),
      is_active: z.boolean(),
    })
    .safeParse(input);
  if (!parsed.success)
    return { error: "Periksa nama, slug, dan urutan kategori." };
  const { id, ...values } = parsed.data;
  const { error } = id
    ? await supabase.from("categories").update(values).eq("id", id)
    : await supabase.from("categories").insert(values);
  if (error)
    return { error: "Kategori belum dapat disimpan. Slug harus unik." };
  refresh();
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function removeUnusedFile(path: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  if (
    !z
      .string()
      .regex(/^[a-f0-9-]{36}\/[a-f0-9-]+\.(jpg|png|webp|mp4|webm)$/)
      .max(200)
      .safeParse(path).success
  )
    return { error: "Path tidak valid." };
  const { data: registered, error } = await supabase
    .from("app_media")
    .select("id")
    .eq("storage_path", path)
    .maybeSingle();
  if (error || registered)
    return { error: "File masih digunakan atau belum dapat diperiksa." };
  const { data, error: storageError } = await supabase.storage
    .from("app-media")
    .remove([path]);
  if (storageError || !data?.length)
    return { error: "File belum dapat dihapus." };
  refresh();
  return { ok: true };
}
