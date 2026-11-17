import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import {
  appTypeLabels,
  requestStatusLabels,
  requestStatuses,
} from "@/lib/custom/validation";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate } from "@/lib/format";
import type { CustomRequestStatus } from "@/lib/supabase/database";

export default async function AdminRequests({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase } = await requireAdmin("/admin/requests");
  const { status: raw } = await searchParams;
  const status = requestStatuses.includes(raw as CustomRequestStatus)
    ? (raw as CustomRequestStatus)
    : null;
  const { data, error } = await supabase
    .from("custom_requests")
    .select("id,name,email,project_name,app_type,status,created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("Permintaan custom belum dapat dimuat.");
  const rows = status ? data.filter((r) => r.status === status) : data;
  return (
    <>
      <div className="admin-toolbar">
        <nav className="tabs" aria-label="Filter status permintaan">
          <Link href="/admin/requests" aria-current={!status ? "page" : undefined}>
            Semua <span className="tab-count">{data.length}</span>
          </Link>
          {requestStatuses.map((s) => (
            <Link
              key={s}
              href={`/admin/requests?status=${s}`}
              aria-current={status === s ? "page" : undefined}
            >
              {requestStatusLabels[s]}
              <span className="tab-count">
                {data.filter((r) => r.status === s).length}
              </span>
            </Link>
          ))}
        </nav>
      </div>
      <section className="panel">
        {rows.length === 0 ? (
          <div className="panel-empty">
            <Inbox size={30} aria-hidden="true" />
            <p>
              {status
                ? "Tidak ada permintaan dengan status ini."
                : "Belum ada permintaan custom yang masuk."}
            </p>
          </div>
        ) : (
          <ul className="list-rows">
            {rows.map((r) => (
              <li key={r.id}>
                <Link className="list-row" href={`/admin/requests/${r.id}`}>
                  <span className="list-row-main">
                    <strong>{r.project_name}</strong>
                    <small>
                      {r.name} · {r.email}
                    </small>
                  </span>
                  <span className="chip chip-muted">{appTypeLabels[r.app_type]}</span>
                  <small className="row-date">{formatDate(r.created_at)}</small>
                  <StatusBadge kind="request" status={r.status}>
                    {requestStatusLabels[r.status]}
                  </StatusBadge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      {data.length >= 500 && (
        <p className="help-text">Menampilkan 500 permintaan terbaru.</p>
      )}
    </>
  );
}
