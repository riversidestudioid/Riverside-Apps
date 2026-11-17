import { LockKeyhole } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { safeAdminPath } from "@/lib/admin/session";

export const metadata = {
  title: "Masuk Admin",
  robots: { index: false, follow: false },
};

const messages: Record<string, string> = {
  forbidden: "Akun Anda tidak memiliki izin admin.",
  expired: "Sesi Anda berakhir atau belum tersedia. Silakan masuk kembali.",
  "logged-out": "Anda berhasil keluar.",
};

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; next?: string }>;
}) {
  const params = await searchParams;
  const configured = hasSupabaseEnv();
  const message = messages[params.status ?? ""];
  return (
    <main id="main" className="page container auth-page">
      <div className="auth-card">
        <span className="auth-icon" aria-hidden="true">
          <LockKeyhole size={26} />
        </span>
        <h1>Masuk Admin</h1>
        <p>Khusus admin Riverside Studio untuk mengelola katalog dan permintaan custom.</p>
        {!configured && (
          <p role="status" className="notice">
            Koneksi Supabase belum dikonfigurasi. Login belum tersedia.
          </p>
        )}
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        <LoginForm configured={configured} next={safeAdminPath(params.next)} />
        <p className="help-text">
          Akun admin diberikan oleh pemilik project. Tidak ada pendaftaran publik.
        </p>
      </div>
    </main>
  );
}
