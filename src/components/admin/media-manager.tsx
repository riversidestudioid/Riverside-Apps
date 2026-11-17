"use client";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Application, Media } from "@/lib/supabase/database";
import { createClient } from "@/lib/supabase/client";
import { validateMediaFile } from "@/lib/admin/media-validation";
import { addMedia, removeMedia, removeUnusedFile } from "@/lib/admin/actions";
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
  const [kind, setKind] = useState<Media["kind"]>("thumbnail");
  const [alt, setAlt] = useState("");
  const [confirm, setConfirm] = useState("");
  const router = useRouter();
  async function upload(form: FormData) {
    const file = form.get("file");
    const shared = {
      app_id: app.id,
      kind,
      replace_id: replace || null,
      alt_text: alt.trim(),
      sort_order: Number(form.get("sort_order")),
    };
    if (!shared.alt_text) {
      setMessage("Isi deskripsi media.");
      return;
    }
    if (kind === "youtube") {
      const r = await addMedia({
        ...shared,
        storage_path: null,
        youtube_url: form.get("youtube_url"),
      });
      setMessage(r.error ?? "Video disimpan.");
      if (r.ok) router.refresh();
      return;
    }
    if (!(file instanceof File)) {
      setMessage("Pilih file.");
      return;
    }
    const invalid = validateMediaFile(file, kind);
    if (invalid) {
      setMessage(invalid);
      return;
    }
    const ext: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "video/mp4": "mp4",
      "video/webm": "webm",
    };
    const path = `${app.id}/${crypto.randomUUID()}.${ext[file.type]}`;
    const db = createClient();
    const { error } = await db.storage
      .from("app-media")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      setMessage("Upload gagal. Periksa sesi, tipe file, dan izin admin.");
      return;
    }
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
    <section className="media-manager">
      <h2>Media Produk</h2>
      <p>
        Ubah aplikasi ke draft sebelum mengubah media. Gambar JPG/PNG/WebP
        maksimal 5 MB, video MP4/WebM maksimal 50 MB.
      </p>
      <p className="notice" role="status">
        {message ||
          "File disimpan secara privat. Hanya media produk published yang dapat dibaca pengunjung."}
      </p>
      <div className="media-grid">
        {media.map((m) => (
          <article className="product-card" key={m.id}>
            {["icon", "thumbnail", "screenshot"].includes(m.kind) && (
              <Image
                unoptimized
                src={`/media/${m.id}?preview=1`}
                alt={m.alt_text}
                width={320}
                height={180}
              />
            )}{" "}
            {m.kind === "video" && (
              <video
                controls
                preload="metadata"
                src={`/media/${m.id}?preview=1`}
                aria-label={m.alt_text}
              />
            )}{" "}
            {m.kind === "youtube" && (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${m.youtube_id}`}
                title={m.alt_text}
                loading="lazy"
                allowFullScreen
              />
            )}
            <span className="badge">{m.kind}</span>
            <p>{m.alt_text}</p>
            <div className="media-card-actions">
              <button
                className="button secondary"
                disabled={pending || app.status !== "draft"}
                onClick={() => {
                  setReplace(m.id);
                  setKind(m.kind);
                  setAlt(m.alt_text);
                }}
              >
                Ganti Media
              </button>
              <button
                className="button secondary"
                disabled={pending || app.status !== "draft"}
                onClick={() => setConfirm(m.id)}
              >
                Hapus Media
              </button>
            </div>
            {confirm === m.id && (
              <div className="delete-confirm">
                <p>Hapus media ini dari aplikasi?</p>
                <button
                  className="button danger"
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
                  className="button secondary"
                  onClick={() => setConfirm("")}
                >
                  Batal
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      <form
        className="editor-form"
        action={(f) =>
          start(async () => {
            try {
              await upload(f);
            } catch {
              setMessage(
                "Upload belum dapat diselesaikan. Periksa sesi dan koneksi.",
              );
            }
          })
        }
      >
        <fieldset disabled={pending || app.status !== "draft"}>
          <legend>{replace ? "Ganti Media" : "Tambah Media"}</legend>
          {replace && (
            <p className="notice">
              File lama tetap terdaftar sampai pengganti berhasil diverifikasi.
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
          <label>
            Jenis media
            <select
              value={kind}
              disabled={Boolean(replace)}
              onChange={(e) => setKind(e.target.value as Media["kind"])}
            >
              {["icon", "thumbnail", "screenshot", "video", "youtube"].map(
                (v) => (
                  <option key={v} value={v}>
                    {v === "icon"
                      ? "Ikon"
                      : v === "youtube"
                        ? "Tautan YouTube"
                        : v === "video"
                          ? "Upload Video"
                          : v === "thumbnail"
                            ? "Thumbnail"
                            : "Screenshot"}
                  </option>
                ),
              )}
            </select>
          </label>
          {kind === "youtube" ? (
            <label>
              URL YouTube
              <input name="youtube_url" type="url" required maxLength={2000} />
            </label>
          ) : (
            <label>
              File
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
          <label>
            Deskripsi media
            <input
              name="alt_text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              required
              maxLength={250}
            />
          </label>
          <label>
            Urutan media
            <input
              name="sort_order"
              type="number"
              min={0}
              max={10000}
              defaultValue={media.length}
            />
          </label>
          <button className="button" disabled={pending}>
            {pending
              ? "Memproses..."
              : replace
                ? "Simpan Media Pengganti"
                : "Unggah / Tambah Media"}
          </button>
        </fieldset>
      </form>
      {unused.length > 0 && (
        <section>
          <h2>File Belum Digunakan</h2>
          <p>File berikut tidak terdaftar sebagai media aplikasi ini.</p>
          {unused.map((path) => (
            <div className="unused-file" key={path}>
              <span>{path.split("/").pop()}</span>
              <button
                className="button secondary"
                disabled={pending}
                onClick={() => setConfirm(path)}
              >
                Hapus File
              </button>
              {confirm === path && (
                <>
                  <button
                    className="button danger"
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
                    className="button secondary"
                    onClick={() => setConfirm("")}
                  >
                    Batal
                  </button>
                </>
              )}
            </div>
          ))}
        </section>
      )}
    </section>
  );
}
