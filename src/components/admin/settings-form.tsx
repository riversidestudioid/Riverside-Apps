"use client";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import {
  socialKeys,
  socialLabels,
  type SiteSettings,
} from "@/lib/admin/settings-validation";
import {
  removeLogo,
  saveLogo,
  saveSettings,
} from "@/app/admin/settings/actions";
import { createClient } from "@/lib/supabase/client";
import { BrandMark } from "@/components/brand";

const textKeys = [
  "site_name",
  "tagline",
  "site_description",
  "support_email",
  "support_whatsapp",
  ...socialKeys,
] as const;
const logoTypes: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [logoMessage, setLogoMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  function uploadLogo(file: File) {
    start(async () => {
      try {
        const ext = logoTypes[file.type];
        if (!ext || file.size <= 0 || file.size > 2 * 1024 * 1024) {
          setLogoMessage(
            "Gunakan PNG, JPG, atau WebP dengan ukuran maksimal 2 MB.",
          );
          return;
        }
        const path = `logo/${crypto.randomUUID()}.${ext}`;
        const { error } = await createClient()
          .storage.from("site-assets")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) {
          setLogoMessage("Upload logo gagal. Periksa sesi dan izin admin.");
          return;
        }
        const r = await saveLogo(path);
        setLogoMessage(r.error ?? "Logo berhasil diperbarui.");
        if (r.ok) router.refresh();
      } catch {
        setLogoMessage("Upload logo belum dapat diselesaikan.");
      } finally {
        if (fileInput.current) fileInput.current.value = "";
      }
    });
  }

  return (
    <div className="settings">
      <section className="panel" aria-labelledby="logo-title">
        <h2 id="logo-title" className="panel-title">
          Logo
        </h2>
        <div className="logo-row">
          <span className="logo-preview">
            {settings.logoUrl ? (
              <Image
                unoptimized
                src={settings.logoUrl}
                alt="Logo saat ini"
                width={72}
                height={72}
              />
            ) : (
              <BrandMark />
            )}
          </span>
          <div className="logo-actions">
            <label className="button button-outline button-sm file-button">
              <ImagePlus size={16} aria-hidden="true" />
              Unggah Logo
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={pending}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadLogo(file);
                }}
              />
            </label>
            {settings.logoUrl && (
              <button
                type="button"
                className="button button-ghost button-sm"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await removeLogo();
                    setLogoMessage(
                      r.error ?? "Logo dihapus. Logo bawaan digunakan.",
                    );
                    if (r.ok) router.refresh();
                  })
                }
              >
                <Trash2 size={16} aria-hidden="true" /> Gunakan Logo Bawaan
              </button>
            )}
            <p className="help-text">
              PNG, JPG, atau WebP persegi, maksimal 2 MB.
            </p>
            <p role="status" className={logoMessage ? "notice" : "sr-only"}>
              {logoMessage}
            </p>
          </div>
        </div>
      </section>

      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          start(async () => {
            try {
              const result = await saveSettings(
                Object.fromEntries(
                  textKeys.map((key) => [
                    key,
                    String(form.get(key) ?? "").trim(),
                  ]),
                ),
              );
              setMessage(
                result.error
                  ? { ok: false, text: result.error }
                  : { ok: true, text: "Pengaturan berhasil disimpan." },
              );
              if (!result.error) router.refresh();
            } catch {
              setMessage({
                ok: false,
                text: "Pengaturan belum dapat disimpan.",
              });
            }
          });
        }}
      >
        <fieldset disabled={pending} className="form-stack">
          <legend className="panel-title">Identitas Website</legend>
          <div className="form-grid">
            <label className="field">
              <span>Nama website</span>
              <input
                name="site_name"
                defaultValue={settings.site_name}
                maxLength={60}
                required
              />
            </label>
            <label className="field">
              <span>Subteks identitas</span>
              <input
                name="tagline"
                defaultValue={settings.tagline}
                maxLength={100}
                required
              />
            </label>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="site-description">
              Deskripsi website
            </label>
            <textarea
              id="site-description"
              name="site_description"
              rows={3}
              defaultValue={settings.site_description}
              maxLength={300}
              aria-describedby="site-description-help"
            />
            <small id="site-description-help">
              Tampil di footer. Maksimal 300 karakter.
            </small>
          </div>

          <h3 className="panel-subtitle">Kontak Resmi</h3>
          <div className="form-grid">
            <label className="field">
              <span>Email kontak</span>
              <input
                name="support_email"
                type="email"
                defaultValue={settings.support_email}
                maxLength={200}
              />
            </label>
            <div className="field">
              <label className="field-label" htmlFor="support-whatsapp">
                WhatsApp bisnis
              </label>
              <input
                id="support-whatsapp"
                name="support_whatsapp"
                defaultValue={settings.support_whatsapp}
                maxLength={15}
                inputMode="numeric"
                pattern="[1-9][0-9]{7,14}"
                placeholder="628123456789"
                aria-describedby="support-whatsapp-help"
              />
              <small id="support-whatsapp-help">
                Format internasional tanpa +. Kosongkan jika belum ada nomor
                resmi.
              </small>
            </div>
          </div>

          <h3 className="panel-subtitle">Sosial Media</h3>
          <div className="form-grid">
            {socialKeys.map((key) => (
              <label className="field" key={key}>
                <span>{socialLabels[key]}</span>
                <input
                  name={key}
                  type="url"
                  defaultValue={settings[key]}
                  maxLength={500}
                  placeholder="https://"
                />
              </label>
            ))}
          </div>
          <p className="help-text">
            Kontak dan sosial media yang kosong tidak ditampilkan. Jangan
            menyimpan API key atau data rahasia di sini — semua nilai dapat
            dibaca publik.
          </p>
          <div className="form-actions">
            <button className="button" type="submit">
              <Save size={17} aria-hidden="true" />
              {pending ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
            <p
              role="status"
              className={
                message ? (message.ok ? "form-ok" : "form-alert") : "sr-only"
              }
            >
              {message?.text ?? ""}
            </p>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
