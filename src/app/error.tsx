"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="content-page container">
      <h1>Halaman belum dapat dimuat</h1>
      <p>Silakan coba kembali.</p>
      <button className="button" onClick={reset}>
        Coba Lagi
      </button>
    </main>
  );
}
