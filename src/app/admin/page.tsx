import Link from "next/link";
import { CodeXml, Eye, FileText, LayoutGrid, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { appTypeLabels, requestStatusLabels } from "@/lib/custom/validation";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate } from "@/lib/format";

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();
  const head = { count: "exact", head: true } as const;
  const apps = () => supabase.from("apps").select("id", head);
  const requestsQuery = () =>
    supabase.from("custom_requests").select("id", head);
  const [total, published, draft, requests, fresh, recent] = await Promise.all([
    apps(),
    apps().eq("status", "published"),
    apps().eq("status", "draft"),
    requestsQuery(),
    requestsQuery().eq("status", "new"),
    supabase
      .from("custom_requests")
      .select("id,name,project_name,app_type,status,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if ([total, published, draft, requests, fresh, recent].some((r) => r.error))
    throw new Error("Ringkasan belum dapat dimuat.");
  // Same order as the reference design: total, requests, published, draft.
  const stats = [
    {
      label: "Total Aplikasi",
      value: total.count ?? 0,
      icon: LayoutGrid,
      href: "/admin/apps",
    },
    {
      label: "Permintaan Custom",
      value: requests.count ?? 0,
      icon: CodeXml,
      href: "/admin/requests",
      note: fresh.count ? `${fresh.count} baru` : undefined,
    },
    {
      label: "Aplikasi Published",
      value: published.count ?? 0,
      icon: Eye,
      href: "/admin/apps?status=published",
    },
    {
      label: "Aplikasi Draft",
      value: draft.count ?? 0,
      icon: FileText,
      href: "/admin/apps?status=draft",
    },
  ];
  return (
    <>
      <section className="stat-grid" aria-label="Statistik">
        {stats.map(({ label, value, icon: Icon, href, note }) => (
          <Link className="stat-card" href={href} key={label}>
            <span className="stat-icon" aria-hidden="true">
              <Icon size={24} />
            </span>
            <span className="stat-body">
              <strong data-testid={`stat-${label}`}>{value}</strong>
              <span>{label}</span>
            </span>
            {note && <span className="stat-note">{note}</span>}
          </Link>
        ))}
      </section>

      <section className="admin-section" aria-labelledby="quick-title">
        <h2 id="quick-title">Aksi Cepat</h2>
        <div className="quick-actions">
          <Link className="button button-lg" href="/admin/apps/new">
            <Plus size={20} aria-hidden="true" /> Tambah Aplikasi
          </Link>
          <Link
            className="button button-outline button-lg"
            href="/admin/requests"
          >
            <CodeXml size={20} aria-hidden="true" /> Kelola Permintaan Custom
          </Link>
        </div>
      </section>

      <section className="panel" aria-labelledby="recent-title">
        <div className="panel-head">
          <h2 id="recent-title">Permintaan Terbaru</h2>
          <Link className="text-link" href="/admin/requests">
            Lihat semua
          </Link>
        </div>
        {recent.data && recent.data.length > 0 ? (
          <ul className="list-rows">
            {recent.data.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/requests/${r.id}`} className="list-row">
                  <span className="list-row-main">
                    <strong>{r.project_name}</strong>
                    <small>
                      {r.name} · {appTypeLabels[r.app_type]} ·{" "}
                      {formatDate(r.created_at)}
                    </small>
                  </span>
                  <StatusBadge kind="request" status={r.status}>
                    {requestStatusLabels[r.status]}
                  </StatusBadge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="panel-empty">Belum ada permintaan custom.</p>
        )}
      </section>
    </>
  );
}
