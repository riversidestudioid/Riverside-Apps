import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { AppEditor } from "@/components/admin/app-editor";
export default async function EditApp({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [app, categories, media, plans] = await Promise.all([
    supabase.from("apps").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("app_media").select("*").eq("app_id", id).order("sort_order"),
    supabase.from("plans").select("*").eq("app_id", id),
  ]);
  if (app.error || categories.error || media.error || plans.error)
    throw new Error("Editor belum dapat dimuat.");
  if (!app.data) notFound();
  return (
    <>
      <h1>Kelola {app.data.name}</h1>
      <AppEditor
        key={app.data.id}
        app={app.data}
        categories={categories.data}
        media={media.data}
        plans={plans.data}
      />
    </>
  );
}
