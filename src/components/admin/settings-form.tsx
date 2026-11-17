"use client";
import { useState, useTransition } from "react";
import type { PublicSettings } from "@/lib/admin/settings-validation";
import { saveSettings } from "@/app/admin/settings/actions";
export function SettingsForm({ settings }: { settings: PublicSettings }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  return (
    <form
      className="editor-form"
      action={(form) =>
        start(async () => {
          try {
            const result = await saveSettings(
              Object.fromEntries(
                [
                  "site_name",
                  "tagline",
                  "support_email",
                  "support_whatsapp",
                ].map((key) => [key, String(form.get(key) ?? "")]),
              ),
            );
            setMessage(result.error ?? "Pengaturan berhasil disimpan.");
          } catch {
            setMessage("Pengaturan belum dapat disimpan.");
          }
        })
      }
    >
      <fieldset disabled={pending}>
        <legend>Identitas dan Kontak Publik</legend>
        <label>
          Nama situs
          <input
            name="site_name"
            defaultValue={settings.site_name}
            maxLength={60}
            required
          />
        </label>
        <label>
          Subteks identitas
          <input
            name="tagline"
            defaultValue={settings.tagline}
            maxLength={100}
            required
          />
        </label>
        <label>
          Email dukungan resmi (opsional)
          <input
            name="support_email"
            type="email"
            defaultValue={settings.support_email}
            maxLength={200}
          />
        </label>
        <label>
          WhatsApp resmi (format internasional tanpa +, opsional)
          <input
            name="support_whatsapp"
            defaultValue={settings.support_whatsapp}
            maxLength={15}
            inputMode="numeric"
            pattern="[1-9][0-9]{7,14}"
          />
        </label>
        <button className="button" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </fieldset>
      <p role="status" className="notice">
        {message ||
          "Nama/subteks tampil di header dan footer. Kontak kosong tidak ditampilkan."}
      </p>
    </form>
  );
}
