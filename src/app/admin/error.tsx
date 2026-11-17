"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function AdminError({ reset }: { reset: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <section className="panel status-panel">
      <h2>Data belum dapat dimuat</h2>
      <p>Periksa koneksi lalu coba kembali.</p>
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
    </section>
  );
}
