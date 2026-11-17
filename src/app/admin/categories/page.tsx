import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { CategoryEditor } from "@/components/admin/category-editor";

export default async function Categories() {
  const { supabase } = await requireAdmin("/admin/categories");
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw new Error("Kategori belum dapat dimuat.");
  return (
    <>
      <div className="admin-toolbar">
        <Link className="back-link" href="/admin/apps">
          <ArrowLeft size={17} aria-hidden="true" /> Kembali ke Aplikasi
        </Link>
      </div>
      <p className="help-text">
        Menonaktifkan kategori juga menyembunyikan aplikasi di dalamnya dari
        katalog publik. Kategori tidak dihapus permanen agar relasi aplikasi
        tetap utuh.
      </p>
      <div className="category-list">
        <CategoryEditor />
        {data.map((c) => (
          <CategoryEditor key={c.id} category={c} />
        ))}
      </div>
    </>
  );
}
