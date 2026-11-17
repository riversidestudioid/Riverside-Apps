"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function RootError({ reset }: { reset: () => void }) {
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
        {pending ? "Memuat..." : "Coba Lagi"}
      </button>
    </main>
  );
}
