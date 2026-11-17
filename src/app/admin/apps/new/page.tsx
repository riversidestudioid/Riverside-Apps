import { requireAdmin } from "@/lib/admin/auth";
import { AppEditor } from "@/components/admin/app-editor";
export default async function NewApp() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw new Error("Kategori belum dapat dimuat.");
  return (
    <>
      <h1>Tambah Aplikasi</h1>
      <p>Simpan draft terlebih dahulu untuk mengunggah media.</p>
      <AppEditor categories={data} media={[]} plans={[]} />
    </>
  );
}
