"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2 } from "lucide-react";
import type { CustomRequestStatus } from "@/lib/supabase/database";
import {
  deleteCustomRequest,
  updateCustomRequest,
} from "@/lib/admin/request-actions";
import {
  requestStatusLabels,
  requestStatuses,
} from "@/lib/custom/validation";

export function RequestManager({
  id,
  status,
  notes,
}: {
  id: string;
  status: CustomRequestStatus;
  notes: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <form
        className="panel form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          start(async () => {
            try {
              const r = await updateCustomRequest({
                id,
                status: form.get("status"),
                admin_notes: String(form.get("admin_notes") ?? ""),
              });
              setMessage(
                r.ok
                  ? { ok: true, text: "Perubahan disimpan." }
                  : { ok: false, text: r.error ?? "Gagal menyimpan." },
              );
              if (r.ok) router.refresh();
            } catch {
              setMessage({ ok: false, text: "Gagal menyimpan. Coba lagi." });
            }
          });
        }}
      >
        <fieldset disabled={pending} className="form-stack">
          <legend className="panel-title">Tindak Lanjut</legend>
          <label className="field">
            <span>Status</span>
            <select name="status" defaultValue={status}>
              {requestStatuses.map((s) => (
                <option key={s} value={s}>
                  {requestStatusLabels[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Catatan internal</span>
            <textarea
              name="admin_notes"
              rows={6}
              maxLength={5000}
              defaultValue={notes}
              placeholder="Hanya terlihat oleh admin."
            />
          </label>
          <button className="button" type="submit">
            <Save size={17} aria-hidden="true" />
            {pending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
          <p
            role="status"
            className={message ? (message.ok ? "form-ok" : "form-alert") : "sr-only"}
          >
            {message?.text ?? ""}
          </p>
        </fieldset>
      </form>
      <section className="panel danger-zone" aria-labelledby="delete-request-title">
        <h2 id="delete-request-title" className="panel-title">
          Hapus Permintaan
        </h2>
        <p className="help-text">Data pengirim akan dihapus permanen.</p>
        {confirm ? (
          <div className="confirm-row" role="group" aria-label="Konfirmasi hapus permintaan">
            <button
              type="button"
              className="button button-danger"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  try {
                    const r = await deleteCustomRequest(id);
                    if (r.ok) {
                      router.push("/admin/requests");
                      router.refresh();
                    } else setMessage({ ok: false, text: r.error ?? "Gagal menghapus." });
                  } catch {
                    setMessage({ ok: false, text: "Gagal menghapus." });
                  }
                })
              }
            >
              Ya, Hapus Permanen
            </button>
            <button
              type="button"
              className="button button-outline"
              onClick={() => setConfirm(false)}
            >
              Batal
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="button button-danger-outline"
            onClick={() => setConfirm(true)}
            disabled={pending}
          >
            <Trash2 size={17} aria-hidden="true" /> Hapus Permintaan
          </button>
        )}
      </section>
    </>
  );
}
