"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  Application,
  Category,
  Media,
  Plan,
} from "@/lib/supabase/database";
import type { AppInput } from "@/lib/catalog/validation";
import { billingLabels } from "@/lib/catalog/validation";
import { saveApp, deleteApp } from "@/lib/admin/actions";
import { MediaManager } from "./media-manager";
export function AppEditor({
  app,
  categories,
  media,
  plans,
}: {
  app?: Application;
  categories: Category[];
  media: Media[];
  plans: Plan[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [prices, setPrices] = useState<AppInput["plans"]>(
    plans.map((p) => ({
      name: p.name,
      billing_type: p.billing_type,
      price_idr: p.price_idr,
      license_policy: p.license_policy,
      features: p.features,
      is_active: p.is_active,
    })),
  );
  function submit(form: FormData) {
    start(async () => {
      try {
        const input = {
          id: app?.id ?? crypto.randomUUID(),
          revision: app?.revision ?? 0,
          slug: form.get("slug"),
          name: form.get("name"),
          tagline: form.get("tagline"),
          short_description: form.get("short_description"),
          description: form.get("description"),
          key_features: String(form.get("key_features") ?? "")
            .split("\n")
            .map((v) => v.trim())
            .filter(Boolean),
          category_id: form.get("category_id"),
          platform: form.get("platform"),
          status: form.get("status"),
          is_visible: form.get("is_visible") === "on",
          is_featured: form.get("is_featured") === "on",
          featured_order: Number(form.get("featured_order")),
          demo_url: form.get("demo_url"),
          launch_url: form.get("launch_url"),
          plans: prices,
        };
        const result = await saveApp(input);
        if (result.error) setMessage(result.error);
        else {
          setMessage("Aplikasi berhasil disimpan.");
          router.replace(`/admin/apps/${result.id}`);
          router.refresh();
        }
      } catch {
        setMessage("Penyimpanan gagal. Periksa koneksi dan coba kembali.");
      }
    });
  }
  function remove() {
    if (!app) return;
    start(async () => {
      try {
        const result = await deleteApp(app.id);
        if (result.ok) {
          router.push("/admin/apps");
          router.refresh();
        } else setMessage(result.error ?? "Gagal menghapus.");
      } catch {
        setMessage("Gagal menghapus.");
      }
    });
  }
  return (
    <>
      <form action={submit} className="editor-form">
        <fieldset disabled={pending}>
          <legend>Informasi aplikasi</legend>
          <div className="form-grid">
            <label>
              Nama aplikasi
              <input
                name="name"
                defaultValue={app?.name}
                required
                maxLength={120}
              />
            </label>
            <label>
              Slug
              <input
                name="slug"
                defaultValue={app?.slug}
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={120}
              />
            </label>
          </div>
          <label>
            Tagline
            <input name="tagline" defaultValue={app?.tagline} maxLength={200} />
          </label>
          <label>
            Deskripsi singkat
            <textarea
              name="short_description"
              defaultValue={app?.short_description}
              maxLength={500}
            />
          </label>
          <label>
            Deskripsi lengkap
            <textarea
              name="description"
              rows={8}
              defaultValue={app?.description}
              maxLength={30000}
            />
          </label>
          <label>
            Fitur utama (satu per baris)
            <textarea
              name="key_features"
              rows={5}
              defaultValue={app?.key_features?.join("\n")}
              maxLength={7500}
            />
          </label>
          <div className="form-grid">
            <label>
              Kategori
              <select name="category_id" defaultValue={app?.category_id ?? ""}>
                <option value="">Pilih kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.is_active ? " (nonaktif)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Platform
              <select name="platform" defaultValue={app?.platform ?? "web"}>
                <option value="web">Web</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
              </select>
            </label>
            <label>
              URL aplikasi (HTTPS)
              <input
                type="url"
                name="launch_url"
                defaultValue={app?.launch_url ?? ""}
                maxLength={2000}
              />
            </label>
            <label>
              URL coba demo (HTTPS, opsional)
              <input
                type="url"
                name="demo_url"
                defaultValue={app?.demo_url ?? ""}
                maxLength={2000}
              />
            </label>
          </div>
          <fieldset>
            <legend id="pricing">Pilihan harga</legend>
            <p className="help-text">
              Kosongkan harga yang belum ditentukan. Harga berbayar tidak
              mengaktifkan checkout.
            </p>
            {prices.map((p, i) => (
              <div className="plan-editor" key={i}>
                <div className="form-grid">
                  <label>
                    Nama paket
                    <input
                      value={p.name}
                      onChange={(e) =>
                        setPrices(
                          prices.map((v, j) =>
                            j === i ? { ...v, name: e.target.value } : v,
                          ),
                        )
                      }
                      required
                      maxLength={100}
                    />
                  </label>
                  <label>
                    Model akses
                    <select
                      value={p.billing_type}
                      onChange={(e) =>
                        setPrices(
                          prices.map((v, j) =>
                            j === i
                              ? {
                                  ...v,
                                  billing_type: e.target
                                    .value as Plan["billing_type"],
                                  price_idr:
                                    e.target.value === "free" ? 0 : null,
                                }
                              : v,
                          ),
                        )
                      }
                    >
                      {Object.entries(billingLabels).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Harga (rupiah)
                    <input
                      type="number"
                      min={0}
                      max={2147483647}
                      step={1}
                      value={p.price_idr ?? ""}
                      onChange={(e) =>
                        setPrices(
                          prices.map((v, j) =>
                            j === i
                              ? {
                                  ...v,
                                  price_idr:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value),
                                }
                              : v,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
                <label>
                  Ketentuan lisensi / masa akses
                  <textarea
                    value={p.license_policy}
                    maxLength={2000}
                    onChange={(e) =>
                      setPrices(
                        prices.map((v, j) =>
                          j === i
                            ? { ...v, license_policy: e.target.value }
                            : v,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Fitur (satu per baris)
                  <textarea
                    value={p.features.join("\n")}
                    onChange={(e) =>
                      setPrices(
                        prices.map((v, j) =>
                          j === i
                            ? { ...v, features: e.target.value.split("\n") }
                            : v,
                        ),
                      )
                    }
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={p.is_active}
                    onChange={(e) =>
                      setPrices(
                        prices.map((v, j) =>
                          j === i ? { ...v, is_active: e.target.checked } : v,
                        ),
                      )
                    }
                  />
                  Paket aktif
                </label>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setPrices(prices.filter((_, j) => j !== i))}
                >
                  Hapus Paket
                </button>
              </div>
            ))}
            <button
              type="button"
              className="button secondary"
              disabled={prices.length >= 12}
              onClick={() =>
                setPrices([
                  ...prices,
                  {
                    name: "",
                    billing_type: "free",
                    price_idr: 0,
                    license_policy: "",
                    features: [],
                    is_active: true,
                  },
                ])
              }
            >
              Tambah Paket
            </button>
          </fieldset>
          <fieldset>
            <legend>Publikasi</legend>
            <label>
              Status
              <select name="status" defaultValue={app?.status ?? "draft"}>
                <option value="draft">Draft</option>
                <option value="published" disabled={!app}>
                  Published
                </option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_visible"
                defaultChecked={app?.is_visible}
              />
              Tampilkan di katalog publik setelah published
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_featured"
                defaultChecked={app?.is_featured}
              />
              Aplikasi unggulan
            </label>
            <label>
              Urutan unggulan
              <input
                name="featured_order"
                type="number"
                min={0}
                max={10000}
                defaultValue={app?.featured_order ?? 0}
              />
            </label>
            <p className="help-text">
              Sebelum publikasi: lengkapi kategori aktif, deskripsi minimal 20
              karakter, thumbnail, URL aplikasi, harga dan ketentuan lisensi
              paket aktif.
            </p>
          </fieldset>
          <button className="button" disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan Aplikasi"}
          </button>
        </fieldset>
      </form>
      <p role="status" className="notice">
        {message ||
          "Simpan perubahan melalui tombol Simpan Aplikasi. Unggah media setelah menyimpan draft."}
      </p>
      {app && (
        <section>
          <MediaManager app={app} media={media} />
          <section className="danger-zone">
            <h2>Hapus Aplikasi</h2>
            <p>
              Penghapusan aplikasi dan metadata media bersifat permanen. Simpan
              perubahan status draft/arsip terlebih dahulu.
            </p>
            {!confirmDelete ? (
              <button
                className="button secondary"
                onClick={() => setConfirmDelete(true)}
                disabled={pending || app.status === "published"}
              >
                Hapus Aplikasi
              </button>
            ) : (
              <div className="hero-actions">
                <button
                  className="button danger"
                  onClick={remove}
                  disabled={pending}
                >
                  Ya, Hapus Permanen
                </button>
                <button
                  className="button secondary"
                  onClick={() => setConfirmDelete(false)}
                >
                  Batal
                </button>
              </div>
            )}
          </section>
        </section>
      )}
    </>
  );
}
