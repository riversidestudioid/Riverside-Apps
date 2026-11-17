"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ExternalLink, Rocket, Save, Trash2 } from "lucide-react";
import type { Application, Category, Media } from "@/lib/supabase/database";
import { saveApp, deleteApp } from "@/lib/admin/actions";
import { MediaManager } from "./media-manager";
import { StatusBadge, appStatusLabels } from "./status-badge";

type Intent = "draft" | "published" | "archived";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function AppEditor({
  app,
  categories,
  media,
}: {
  app?: Application;
  categories: Category[];
  media: Media[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [slug, setSlug] = useState(app?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(app));
  const hasIcon = media.some((m) => m.kind === "icon" || m.kind === "thumbnail");

  // onSubmit (not a form action) so a failed save never resets the admin's edits.
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const requested = submitter?.getAttribute("data-intent");
    const status: Intent =
      requested === "published" || requested === "archived" ? requested : "draft";
    const form = new FormData(event.currentTarget);
    start(async () => {
      try {
        const result = await saveApp({
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
          status,
          is_visible: status === "published",
          is_featured: form.get("is_featured") === "on",
          featured_order: Number(form.get("featured_order") || 0),
          demo_url: String(form.get("demo_url") ?? "").trim(),
          launch_url: String(form.get("launch_url") ?? "").trim(),
        });
        if (result.error) setMessage({ tone: "error", text: result.error });
        else {
          setMessage({
            tone: "ok",
            text:
              status === "published"
                ? "Aplikasi berhasil dipublikasikan."
                : status === "archived"
                  ? "Aplikasi diarsipkan."
                  : "Draft berhasil disimpan.",
          });
          if (!app) router.replace(`/admin/apps/${result.id}`);
          router.refresh();
        }
      } catch {
        setMessage({
          tone: "error",
          text: "Penyimpanan gagal. Periksa koneksi dan coba kembali.",
        });
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
        } else
          setMessage({ tone: "error", text: result.error ?? "Gagal menghapus." });
      } catch {
        setMessage({ tone: "error", text: "Gagal menghapus." });
      }
    });
  }

  return (
    <div className="editor">
      <form onSubmit={submit} className="editor-layout">
        <div className="editor-main">
          <fieldset className="panel" disabled={pending}>
            <legend className="panel-title">Informasi Aplikasi</legend>
            <div className="form-grid">
              <label className="field">
                <span>Nama aplikasi</span>
                <input
                  name="name"
                  defaultValue={app?.name}
                  required
                  maxLength={120}
                  onChange={(e) => {
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                />
              </label>
              <label className="field">
                <span>Slug URL</span>
                <input
                  name="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  maxLength={120}
                  aria-describedby="slug-help"
                />
                <small id="slug-help">/apps/{slug || "nama-aplikasi"}</small>
              </label>
              <label className="field">
                <span>Kategori</span>
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
              <label className="field">
                <span>Platform</span>
                <select name="platform" defaultValue={app?.platform ?? "web"}>
                  <option value="web">Web App</option>
                  <option value="desktop">Desktop</option>
                  <option value="mobile">Mobile</option>
                </select>
              </label>
            </div>
            <label className="field">
              <span>Tagline (opsional)</span>
              <input name="tagline" defaultValue={app?.tagline} maxLength={200} />
            </label>
            <label className="field">
              <span>Deskripsi singkat</span>
              <textarea
                name="short_description"
                rows={2}
                defaultValue={app?.short_description}
                maxLength={500}
                aria-describedby="short-help"
              />
              <small id="short-help">Tampil di kartu katalog. Maksimal 500 karakter.</small>
            </label>
            <label className="field">
              <span>Deskripsi lengkap</span>
              <textarea
                name="description"
                rows={8}
                defaultValue={app?.description}
                maxLength={30000}
              />
            </label>
            <label className="field">
              <span>Fitur utama (satu per baris)</span>
              <textarea
                name="key_features"
                rows={5}
                defaultValue={app?.key_features?.join("\n")}
                maxLength={7500}
              />
            </label>
          </fieldset>

          <fieldset className="panel" disabled={pending}>
            <legend className="panel-title">Tautan</legend>
            <div className="form-grid">
              <label className="field">
                <span>URL aplikasi (HTTPS)</span>
                <input
                  type="url"
                  name="launch_url"
                  defaultValue={app?.launch_url ?? ""}
                  placeholder="https://"
                  maxLength={2000}
                />
              </label>
              <label className="field">
                <span>URL demo (HTTPS, opsional)</span>
                <input
                  type="url"
                  name="demo_url"
                  defaultValue={app?.demo_url ?? ""}
                  placeholder="https://"
                  maxLength={2000}
                />
              </label>
            </div>
          </fieldset>
        </div>

        <aside className="editor-side">
          <fieldset className="panel publish-panel" disabled={pending}>
            <legend className="panel-title">Publikasi</legend>
            <p className="publish-status">
              Status:{" "}
              <StatusBadge kind="app" status={app?.status ?? "draft"}>
                {appStatusLabels[app?.status ?? "draft"]}
              </StatusBadge>
            </p>
            <label className="check-field">
              <input
                type="checkbox"
                name="is_featured"
                defaultChecked={app?.is_featured}
              />
              <span>Tampilkan di Aplikasi Pilihan (beranda)</span>
            </label>
            <label className="field">
              <span>Urutan pilihan</span>
              <input
                name="featured_order"
                type="number"
                min={0}
                max={10000}
                defaultValue={app?.featured_order ?? 0}
              />
            </label>
            <div className="publish-actions">
              <button
                type="submit"
                className="button"
                disabled={!app}
                data-intent="published"
              >
                <Rocket size={18} aria-hidden="true" /> Publish
              </button>
              <button
                type="submit"
                className="button button-outline"
                data-intent="draft"
              >
                <Save size={18} aria-hidden="true" /> Simpan Draft
              </button>
              {app && (
                <button
                  type="submit"
                  className="button button-ghost"
                  data-intent="archived"
                >
                  <Archive size={18} aria-hidden="true" /> Arsipkan
                </button>
              )}
            </div>
            <p className="help-text">
              {!app
                ? "Simpan draft terlebih dahulu, lalu unggah ikon sebelum publish."
                : app.status === "published"
                  ? "Klik Publish untuk menyimpan perubahan dan tetap tampil di katalog."
                  : "Publish memerlukan kategori, deskripsi lengkap minimal 20 karakter, URL aplikasi HTTPS, dan ikon."}
            </p>
            {app && !hasIcon && (
              <p className="notice notice-warn">Belum ada ikon. Unggah ikon pada bagian Media.</p>
            )}
            {app?.status === "published" && (
              <Link className="text-link" href={`/apps/${app.slug}`} target="_blank">
                Lihat di website <ExternalLink size={15} aria-hidden="true" />
              </Link>
            )}
          </fieldset>
          <p
            role="status"
            className={message ? `form-${message.tone === "ok" ? "ok" : "alert"}` : "sr-only"}
          >
            {pending ? "Menyimpan..." : (message?.text ?? "")}
          </p>
        </aside>
      </form>

      {app && (
        <>
          <MediaManager app={app} media={media} />
          <section className="panel danger-zone" aria-labelledby="danger-title">
            <h2 id="danger-title">Hapus Aplikasi</h2>
            <p>
              Penghapusan aplikasi beserta medianya bersifat permanen.
              {app.status === "published" &&
                " Arsipkan atau simpan sebagai draft terlebih dahulu."}
            </p>
            {!confirmDelete ? (
              <button
                type="button"
                className="button button-danger-outline"
                onClick={() => setConfirmDelete(true)}
                disabled={pending || app.status === "published"}
              >
                <Trash2 size={17} aria-hidden="true" /> Hapus Aplikasi
              </button>
            ) : (
              <div className="confirm-row" role="group" aria-label="Konfirmasi hapus">
                <span>Hapus &ldquo;{app.name}&rdquo; secara permanen?</span>
                <button
                  type="button"
                  className="button button-danger"
                  onClick={remove}
                  disabled={pending}
                >
                  Ya, Hapus Permanen
                </button>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setConfirmDelete(false)}
                >
                  Batal
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
