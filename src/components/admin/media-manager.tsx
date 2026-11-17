"use client";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import type { Application, Media } from "@/lib/supabase/database";
import { createClient } from "@/lib/supabase/client";
import { validateMediaFile } from "@/lib/admin/media-validation";
import { addMedia, removeMedia, removeUnusedFile } from "@/lib/admin/actions";

const kindLabels: Record<Media["kind"], string> = {
  icon: "Ikon",
  thumbnail: "Thumbnail",
  screenshot: "Screenshot",
  video: "Video (upload)",
  youtube: "Video YouTube",
};
// Thumbnail is legacy: existing ones can still be replaced or removed.
const uploadKinds: Media["kind"][] = ["icon", "screenshot", "video", "youtube"];
const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export function MediaManager({
  app,
  media,
  unused = [],
}: {
  app: Application;
  media: Media[];
  unused?: string[];
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [replace, setReplace] = useState("");
  const [kind, setKind] = useState<Media["kind"]>(
    media.some((m) => m.kind === "icon") ? "screenshot" : "icon",
  );
  const [alt, setAlt] = useState("");
  const [confirm, setConfirm] = useState("");
  const router = useRouter();
  const editable = app.status === "draft";

  async function upload(form: FormData) {
    const file = form.get("file");
    const shared = {
      app_id: app.id,
      kind,
      replace_id: replace || null,
      alt_text: alt.trim(),
      sort_order: Number(form.get("sort_order") || 0),
    };
    if (!shared.alt_text) return setMessage("Isi deskripsi media.");
    if (kind === "youtube") {
      const r = await addMedia({
        ...shared,
        storage_path: null,
        youtube_url: form.get("youtube_url"),
      });
      setMessage(r.error ?? "Video disimpan.");
      if (r.ok) {
        setAlt("");
        router.refresh();
      }
      return;
    }
    if (!(file instanceof File) || !file.size) return setMessage("Pilih file.");
    const invalid = validateMediaFile(file, kind);
    if (invalid) return setMessage(invalid);
    const path = `${app.id}/${crypto.randomUUID()}.${extensions[file.type]}`;
    const db = createClient();
    const { error } = await db.storage
      .from("app-media")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error)
      return setMessage("Upload gagal. Periksa sesi, tipe file, dan izin admin.");
    const r = await addMedia({
      ...shared,
      storage_path: path,
      original_name: file.name,
    });
    if (!r.ok) await db.storage.from("app-media").remove([path]);
    setMessage(
      r.error ??
        (replace ? "Media berhasil diganti." : "Media berhasil ditambahkan."),
    );
    if (r.ok) {
      setReplace("");
      setAlt("");
      router.refresh();
    }
  }

  return (
    <section className="panel media-manager" aria-labelledby="media-title">
      <div className="panel-head">
        <h2 id="media-title">Media</h2>
      </div>
      <p className="help-text">
        Ikon tampil di kartu katalog. Gambar JPG/PNG/WebP maks. 5 MB, video
        MP4/WebM maks. 50 MB. File disimpan privat dan hanya terlihat publik
        setelah aplikasi dipublish.
      </p>
      {!editable && (
        <p className="notice notice-warn">
          Media hanya dapat diubah saat status Draft. Klik{" "}
          <strong>Simpan Draft</strong> terlebih dahulu.
        </p>
      )}
      <p role="status" className={message ? "notice" : "sr-only"}>
        {message}
      </p>

      {media.length > 0 ? (
        <div className="media-grid">
          {media.map((m) => (
            <article className="media-item" key={m.id}>
              <div className={`media-preview media-${m.kind}`}>
                {["icon", "thumbnail", "screenshot"].includes(m.kind) && (
                  <Image
                    unoptimized
                    src={`/media/${m.id}?preview=1`}
                    alt={m.alt_text}
                    width={320}
                    height={200}
                  />
                )}
                {m.kind === "video" && (
                  <video
                    controls
                    preload="metadata"
                    src={`/media/${m.id}?preview=1`}
                    aria-label={m.alt_text}
                  />
                )}
                {m.kind === "youtube" && (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${m.youtube_id}`}
                    title={m.alt_text}
                    loading="lazy"
                    allowFullScreen
                  />
                )}
              </div>
              <div className="media-meta">
                <span className="chip">{kindLabels[m.kind]}</span>
                <p>{m.alt_text}</p>
              </div>
              {confirm === m.id ? (
                <div className="confirm-row" role="group" aria-label="Konfirmasi hapus media">
                  <span>Hapus media ini?</span>
                  <button
                    type="button"
                    className="button button-danger button-sm"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        try {
                          const r = await removeMedia(m.id);
                          setMessage(r.error ?? "Media dihapus.");
                          setConfirm("");
                          if (r.ok) router.refresh();
                        } catch {
                          setMessage("Media gagal dihapus.");
                        }
                      })
                    }
                  >
                    Ya, Hapus Media
                  </button>
                  <button
                    type="button"
                    className="button button-outline button-sm"
                    onClick={() => setConfirm("")}
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <div className="media-actions">
                  <button
                    type="button"
                    className="button button-outline button-sm"
                    disabled={pending || !editable}
                    onClick={() => {
                      setReplace(m.id);
                      setKind(m.kind);
                      setAlt(m.alt_text);
                    }}
                  >
                    <RefreshCw size={15} aria-hidden="true" /> Ganti Media
                  </button>
                  <button
                    type="button"
                    className="button button-ghost button-sm"
                    disabled={pending || !editable}
                    onClick={() => setConfirm(m.id)}
                    aria-label={`Hapus Media ${m.alt_text}`}
                  >
                    <Trash2 size={15} aria-hidden="true" /> Hapus
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="panel-empty">Belum ada media. Mulai dengan mengunggah ikon.</p>
      )}

      <form
        className="upload-form"
        action={(f) =>
          start(async () => {
            try {
              await upload(f);
            } catch {
              setMessage("Upload belum dapat diselesaikan. Periksa sesi dan koneksi.");
            }
          })
        }
      >
        <fieldset disabled={pending || !editable}>
          <legend className="panel-subtitle">
            {replace ? "Ganti Media" : "Tambah Media"}
          </legend>
          {replace && (
            <p className="notice">
              Media lama tetap terpasang sampai pengganti berhasil diverifikasi.{" "}
              <button
                className="text-link"
                type="button"
                onClick={() => {
                  setReplace("");
                  setAlt("");
                }}
              >
                Batalkan penggantian
              </button>
            </p>
          )}
          <div className="form-grid">
            <label className="field">
              <span>Jenis media</span>
              <select
                value={kind}
                disabled={Boolean(replace)}
                onChange={(e) => setKind(e.target.value as Media["kind"])}
              >
                {(replace ? [kind] : uploadKinds).map((v) => (
                  <option key={v} value={v}>
                    {kindLabels[v]}
                  </option>
                ))}
              </select>
            </label>
            {kind === "youtube" ? (
              <label className="field">
                <span>URL YouTube</span>
                <input name="youtube_url" type="url" required maxLength={2000} placeholder="https://www.youtube.com/watch?v=" />
              </label>
            ) : (
              <label className="field">
                <span>File</span>
                <input
                  name="file"
                  type="file"
                  required
                  accept={
                    kind === "video"
                      ? "video/mp4,video/webm"
                      : "image/jpeg,image/png,image/webp"
                  }
                />
              </label>
            )}
            <label className="field">
              <span>Deskripsi media</span>
              <input
                name="alt_text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                required
                maxLength={250}
                placeholder="Contoh: Tampilan halaman utama"
              />
            </label>
            <label className="field">
              <span>Urutan</span>
              <input
                name="sort_order"
                type="number"
                min={0}
                max={10000}
                defaultValue={media.length}
              />
            </label>
          </div>
          <button className="button" disabled={pending}>
            <ImagePlus size={18} aria-hidden="true" />
            {pending
              ? "Memproses..."
              : replace
                ? "Simpan Media Pengganti"
                : "Unggah Media"}
          </button>
        </fieldset>
      </form>

      {unused.length > 0 && (
        <section className="unused-files" aria-labelledby="unused-title">
          <h3 id="unused-title">File Belum Digunakan</h3>
          <p className="help-text">File berikut tidak terdaftar sebagai media aplikasi ini.</p>
          <ul className="list-rows">
            {unused.map((path) => (
              <li className="list-row" key={path}>
                <span className="list-row-main">
                  <code>{path.split("/").pop()}</code>
                </span>
                {confirm === path ? (
                  <span className="row-actions">
                    <button
                      type="button"
                      className="button button-danger button-sm"
                      onClick={() =>
                        start(async () => {
                          const r = await removeUnusedFile(path);
                          setMessage(r.error ?? "File tidak digunakan dihapus.");
                          setConfirm("");
                          if (r.ok) router.refresh();
                        })
                      }
                      disabled={pending}
                    >
                      Konfirmasi Hapus File
                    </button>
                    <button
                      type="button"
                      className="button button-outline button-sm"
                      onClick={() => setConfirm("")}
                    >
                      Batal
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="button button-ghost button-sm"
                    disabled={pending}
                    onClick={() => setConfirm(path)}
                  >
                    Hapus File
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
