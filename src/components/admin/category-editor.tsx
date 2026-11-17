"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/supabase/database";
import { saveCategory } from "@/lib/admin/actions";
import { Icon } from "@/components/icon";

const iconOptions = [
  ["grid", "Umum"],
  ["church", "Gereja"],
  ["education", "Pendidikan"],
  ["business", "Bisnis"],
  ["layers", "Produktivitas"],
  ["image", "Media"],
  ["code", "Developer"],
  ["settings", "Utilitas"],
] as const;

export function CategoryEditor({ category }: { category?: Category }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [icon, setIcon] = useState(category?.icon ?? "grid");
  const router = useRouter();
  return (
    <form
      className={`panel category-form ${category ? "" : "category-new"}`}
      onSubmit={(event) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        const f = new FormData(formElement);
        start(async () => {
          try {
            const r = await saveCategory({
              id: category?.id,
              name: f.get("name"),
              slug: f.get("slug"),
              icon: f.get("icon"),
              sort_order: Number(f.get("sort_order") || 0),
              is_active: f.get("is_active") === "on",
            });
            setMessage(r.error ?? "Kategori disimpan.");
            if (r.ok) {
              if (!category) formElement.reset();
              router.refresh();
            }
          } catch {
            setMessage("Gagal menyimpan kategori.");
          }
        });
      }}
    >
      <fieldset disabled={pending}>
        <legend className="panel-subtitle">
          <span className="category-icon" aria-hidden="true">
            <Icon name={icon} size={20} />
          </span>
          {category ? category.name : "Tambah Kategori"}
        </legend>
        <div className="form-grid form-grid-4">
          <label className="field">
            <span>Nama</span>
            <input name="name" required defaultValue={category?.name} maxLength={80} />
          </label>
          <label className="field">
            <span>Slug</span>
            <input
              name="slug"
              required
              defaultValue={category?.slug}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={80}
            />
          </label>
          <label className="field">
            <span>Ikon</span>
            <select name="icon" value={icon} onChange={(e) => setIcon(e.target.value)}>
              {iconOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Urutan</span>
            <input
              name="sort_order"
              type="number"
              min={0}
              max={1000}
              defaultValue={category?.sort_order ?? 0}
            />
          </label>
        </div>
        <div className="category-foot">
          <label className="check-field">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={category?.is_active ?? true}
            />
            <span>Kategori aktif</span>
          </label>
          <span role="status" className="inline-status">
            {message}
          </span>
          <button className="button button-sm" disabled={pending}>
            Simpan Kategori
          </button>
        </div>
      </fieldset>
    </form>
  );
}
