"use client";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { CircleCheck, Send } from "lucide-react";
import {
  submitCustomRequest,
  type CustomRequestState,
} from "@/lib/custom/actions";
import { appTypeLabels, appTypes } from "@/lib/custom/validation";

const initial: CustomRequestState = { status: "idle", message: "" };

export function CustomRequestForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(submitCustomRequest, initial);
  const mountedAt = useRef(0);
  const summary = useRef<HTMLDivElement>(null);
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);
  useEffect(() => {
    if (state.status !== "idle") summary.current?.focus();
  }, [state]);

  if (state.status === "success")
    return (
      <div
        className="form-success"
        role="status"
        tabIndex={-1}
        ref={summary}
      >
        <CircleCheck size={40} aria-hidden="true" />
        <h2>{state.message}</h2>
        <p>
          Tim Riverside Studio akan meninjau kebutuhan Anda dan menghubungi
          melalui email atau WhatsApp yang Anda berikan.
        </p>
        <Link href="/apps" className="button button-outline">
          Jelajahi Aplikasi
        </Link>
      </div>
    );

  const err = state.fieldErrors ?? {};
  const describe = (field: keyof typeof err) =>
    err[field] ? `${field}-error` : undefined;
  const fieldError = (field: keyof typeof err) =>
    err[field] ? (
      <span className="field-error" id={`${field}-error`}>
        {err[field]}
      </span>
    ) : null;

  return (
    <form
      className="form-card"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        data.set(
          "fill_ms",
          String(mountedAt.current ? Date.now() - mountedAt.current : 0),
        );
        startTransition(() => action(data));
      }}
    >
      {!configured && (
        <p className="notice" role="status">
          Formulir belum aktif karena layanan database belum dikonfigurasi.
          Permintaan belum dapat dikirim.
        </p>
      )}
      <div
        ref={summary}
        tabIndex={-1}
        role={state.status === "error" ? "alert" : undefined}
        className={state.status === "error" ? "form-alert" : "sr-only"}
      >
        {state.status === "error" ? state.message : ""}
      </div>
      <fieldset disabled={pending || !configured}>
        <legend className="sr-only">Data permintaan aplikasi custom</legend>
        <div className="form-grid">
          <label className="field">
            <span>Nama</span>
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={120}
              aria-invalid={Boolean(err.name)}
              aria-describedby={describe("name")}
            />
            {fieldError("name")}
          </label>
          <label className="field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              aria-invalid={Boolean(err.email)}
              aria-describedby={describe("email")}
            />
            {fieldError("email")}
          </label>
          <label className="field">
            <span>Nomor WhatsApp</span>
            <input
              name="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0812xxxxxxxx"
              required
              maxLength={30}
              aria-invalid={Boolean(err.whatsapp)}
              aria-describedby={describe("whatsapp")}
            />
            {fieldError("whatsapp")}
          </label>
          <label className="field">
            <span>Nama proyek</span>
            <input
              name="project_name"
              required
              maxLength={150}
              placeholder="Contoh: Sistem absensi jemaat"
              aria-invalid={Boolean(err.project_name)}
              aria-describedby={describe("project_name")}
            />
            {fieldError("project_name")}
          </label>
        </div>

        <fieldset
          className="choice-group"
          aria-describedby={describe("app_type")}
        >
          <legend>Jenis aplikasi</legend>
          <div className="choice-grid">
            {appTypes.map((type) => (
              <label className="choice" key={type}>
                <input type="radio" name="app_type" value={type} required />
                <span>{appTypeLabels[type]}</span>
              </label>
            ))}
          </div>
          {fieldError("app_type")}
        </fieldset>

        <label className="field">
          <span>Deskripsi kebutuhan</span>
          <textarea
            name="description"
            rows={6}
            required
            maxLength={5000}
            placeholder="Ceritakan tujuan aplikasi, pengguna, fitur utama, dan target waktu jika ada."
            aria-invalid={Boolean(err.description)}
            aria-describedby={describe("description")}
          />
          {fieldError("description")}
        </label>

        <div className="hp-field" aria-hidden="true">
          <label>
            Website perusahaan
            <input
              name="company_website"
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>

        <label className="check-field">
          <input
            type="checkbox"
            name="privacy_consent"
            required
            aria-invalid={Boolean(err.privacy_consent)}
            aria-describedby={describe("privacy_consent")}
          />
          <span>
            Saya menyetujui{" "}
            <Link href="/privacy" target="_blank">
              Kebijakan Privasi
            </Link>{" "}
            dan bersedia dihubungi melalui email atau WhatsApp terkait
            permintaan ini.
          </span>
        </label>
        {fieldError("privacy_consent")}

        <button className="button button-lg form-submit" type="submit">
          <Send size={18} aria-hidden="true" />
          {pending ? "Mengirim..." : "Kirim Permintaan"}
        </button>
      </fieldset>
    </form>
  );
}
