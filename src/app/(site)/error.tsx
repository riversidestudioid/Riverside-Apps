"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";

export default function SiteError({ reset }: { reset: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <main id="main" className="page container status-page">
      <h1>Halaman belum dapat dimuat</h1>
      <p>Silakan coba kembali. Jika masalah berlanjut, coba beberapa saat lagi.</p>
      <button
        type="button"
        className="button"
        disabled={pending}
        onClick={() =>
          start(() => {
            router.refresh();
            reset();
          })
        }
      >
        <RefreshCw size={18} aria-hidden="true" />
        {pending ? "Memuat..." : "Coba Lagi"}
      </button>
    </main>
  );
}
