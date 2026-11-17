import { LoginForm } from "@/components/admin/login-form";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { safeAdminPath } from "@/lib/admin/session";
export const metadata = {
  title: "Login Admin",
  robots: { index: false, follow: false },
};
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; next?: string }>;
}) {
  const params = await searchParams;
  const configured = hasSupabaseEnv();
  const messages: Record<string, string> = {
    forbidden: "Akun Anda tidak memiliki izin admin.",
    expired: "Sesi Anda berakhir atau belum tersedia. Silakan masuk kembali.",
    "logged-out": "Anda berhasil keluar.",
  };
  return (
    <main id="main" className="content-page container login-page">
      <span className="ecosystem">Riverside Studio</span>
      <h1>Masuk ke Dashboard Admin</h1>
      <p>Kelola katalog, media, dan pilihan harga aplikasi.</p>
      {!configured && (
        <p role="status" className="notice">
          Koneksi Supabase belum dikonfigurasi. Login belum tersedia.
        </p>
      )}
      {messages[params.status ?? ""] && (
        <p role="status" className="notice">
          {messages[params.status ?? ""]}
        </p>
      )}
      <LoginForm configured={configured} next={safeAdminPath(params.next)} />
      <p className="help-text">
        Akses admin diberikan oleh pemilik project. Tidak ada pendaftaran admin
        publik.
      </p>
    </main>
  );
}
