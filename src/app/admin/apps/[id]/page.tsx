import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { AppEditor } from "@/components/admin/app-editor";

export default async function EditApp({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin(`/admin/apps/${id}`);
  if (!z.uuid().safeParse(id).success) notFound();
  const [app, categories, media] = await Promise.all([
    supabase.from("apps").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("app_media").select("*").eq("app_id", id).order("sort_order"),
  ]);
  if (app.error || categories.error || media.error)
    throw new Error("Editor belum dapat dimuat.");
  if (!app.data) notFound();
  return (
    <AppEditor
      key={app.data.id}
      app={app.data}
      categories={categories.data}
      media={media.data}
    />
  );
}
