export default function AdminLoading() {
  return (
    <section className="panel status-panel" aria-busy="true">
      <span className="spinner" aria-hidden="true" />
      <p>Memuat data...</p>
    </section>
  );
}
