import { requireAdmin } from "@/lib/admin/auth";
import { AppEditor } from "@/components/admin/app-editor";

export default async function NewApp() {
  const { supabase } = await requireAdmin("/admin/apps/new");
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw new Error("Kategori belum dapat dimuat.");
  return <AppEditor categories={data} media={[]} />;
}
