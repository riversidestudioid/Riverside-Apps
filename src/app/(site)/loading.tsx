export default function Loading() {
  return (
    <main id="main" className="page container loading" aria-busy="true">
      <span className="spinner" aria-hidden="true" />
      <p>Memuat...</p>
    </main>
  );
}
