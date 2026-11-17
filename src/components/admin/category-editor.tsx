"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/supabase/database";
import { saveCategory } from "@/lib/admin/actions";
export function CategoryEditor({ category }: { category?: Category }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <form
      className="editor-form product-card"
      action={(f) =>
        start(async () => {
          try {
            const r = await saveCategory({
              id: category?.id,
              name: f.get("name"),
              slug: f.get("slug"),
              icon: f.get("icon"),
              sort_order: Number(f.get("sort_order")),
              is_active: f.get("is_active") === "on",
            });
            setMessage(r.error ?? "Kategori disimpan.");
            if (r.ok) router.refresh();
          } catch {
            setMessage("Gagal menyimpan kategori.");
          }
        })
      }
    >
      <fieldset disabled={pending}>
        <legend>{category ? "Edit Kategori" : "Tambah Kategori"}</legend>
        <div className="form-grid">
          <label>
            Nama
            <input
              name="name"
              required
              defaultValue={category?.name}
              maxLength={80}
            />
          </label>
          <label>
            Slug
            <input
              name="slug"
              required
              defaultValue={category?.slug}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={80}
            />
          </label>
          <label>
            Ikon
            <select name="icon" defaultValue={category?.icon ?? "grid"}>
              {[
                "grid",
                "church",
                "education",
                "business",
                "layers",
                "image",
                "code",
                "settings",
              ].map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </label>
          <label>
            Urutan
            <input
              name="sort_order"
              type="number"
              min={0}
              max={1000}
              defaultValue={category?.sort_order ?? 0}
            />
          </label>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={category?.is_active ?? true}
          />
          Kategori aktif
        </label>
        <button className="button" disabled={pending}>
          Simpan Kategori
        </button>
        <p role="status">{message}</p>
      </fieldset>
    </form>
  );
}
