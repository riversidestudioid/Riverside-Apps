"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
export default function Error({ reset }: { reset: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <main id="main" className="content-page container">
      <h1>Halaman belum dapat dimuat</h1>
      <p>
        Silakan coba kembali. Jika masalah berlanjut, coba beberapa saat lagi.
      </p>
      <button
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
