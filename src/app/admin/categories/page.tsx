import { requireAdmin } from "@/lib/admin/auth";
import { CategoryEditor } from "@/components/admin/category-editor";
export default async function Categories() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw new Error("Kategori belum dapat dimuat.");
  return (
    <>
      <h1>Kelola Kategori</h1>
      <p>
        Menonaktifkan kategori juga menyembunyikan produk terkait dari katalog
        publik.
      </p>
      <CategoryEditor />
      {data.map((c) => (
        <CategoryEditor key={c.id} category={c} />
      ))}
    </>
  );
}
