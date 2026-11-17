import Link from "next/link";
import { ExternalLink, FolderCog, Images, Pencil, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { AppIcon } from "@/components/app-card";
import {
  StatusBadge,
  appStatusLabels,
} from "@/components/admin/status-badge";
import { formatDate } from "@/lib/format";

const filters = [
  { value: "", label: "Semua" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Arsip" },
];

export default async function AdminApps({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase } = await requireAdmin("/admin/apps");
  const { status: rawStatus } = await searchParams;
  const status = filters.some((f) => f.value === rawStatus) ? rawStatus! : "";
  const [apps, categories, media] = await Promise.all([
    supabase.from("apps").select("*").order("updated_at", { ascending: false }),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("app_media").select("id,app_id,kind"),
  ]);
  if (apps.error || categories.error || media.error)
    throw new Error("Daftar aplikasi belum dapat dimuat.");
  const rows = status ? apps.data.filter((a) => a.status === status) : apps.data;
  const iconFor = (appId: string) =>
    media.data.find((m) => m.app_id === appId && m.kind === "icon")?.id ??
    media.data.find((m) => m.app_id === appId && m.kind === "thumbnail")?.id ??
    null;
  const category = (id: string | null) =>
    categories.data.find((c) => c.id === id);
  return (
    <>
      <div className="admin-toolbar">
        <nav className="tabs" aria-label="Filter status aplikasi">
          {filters.map((f) => (
            <Link
              key={f.value}
              href={f.value ? `/admin/apps?status=${f.value}` : "/admin/apps"}
              aria-current={status === f.value ? "page" : undefined}
            >
              {f.label}
              <span className="tab-count">
                {f.value
                  ? apps.data.filter((a) => a.status === f.value).length
                  : apps.data.length}
              </span>
            </Link>
          ))}
        </nav>
        <div className="toolbar-actions">
          <Link className="button button-outline button-sm" href="/admin/categories">
            <FolderCog size={17} aria-hidden="true" /> Kategori
          </Link>
          <Link className="button button-outline button-sm" href="/admin/media">
            <Images size={17} aria-hidden="true" /> File Media
          </Link>
          <Link className="button button-sm" href="/admin/apps/new">
            <Plus size={17} aria-hidden="true" /> Tambah Aplikasi
          </Link>
        </div>
      </div>

      <section className="panel">
        {rows.length === 0 ? (
          <div className="panel-empty">
            <p>
              {status
                ? "Tidak ada aplikasi dengan status ini."
                : "Belum ada aplikasi. Tambahkan aplikasi pertama sebagai draft."}
            </p>
            {!status && (
              <Link className="button" href="/admin/apps/new">
                <Plus size={18} aria-hidden="true" /> Tambah Aplikasi
              </Link>
            )}
          </div>
        ) : (
          <ul className="list-rows app-rows">
            {rows.map((a) => {
              const c = category(a.category_id);
              return (
                <li key={a.id} className="list-row">
                  <AppIcon
                    mediaId={iconFor(a.id)}
                    fallbackIcon={c?.icon ?? "grid"}
                    seed={a.slug}
                    size={48}
                    preview
                  />
                  <span className="list-row-main">
                    <strong>{a.name}</strong>
                    <small>
                      {c?.name ?? "Tanpa kategori"} · Diperbarui{" "}
                      {formatDate(a.updated_at)}
                      {a.is_featured ? " · Pilihan" : ""}
                    </small>
                  </span>
                  <StatusBadge kind="app" status={a.status}>
                    {appStatusLabels[a.status]}
                  </StatusBadge>
                  <span className="row-actions">
                    {a.status === "published" && (
                      <Link
                        className="icon-button"
                        href={`/apps/${a.slug}`}
                        target="_blank"
                        aria-label={`Lihat ${a.name} di website`}
                      >
                        <ExternalLink size={18} />
                      </Link>
                    )}
                    <Link
                      className="button button-outline button-sm"
                      href={`/admin/apps/${a.id}`}
                      aria-label={`Edit ${a.name}`}
                    >
                      <Pencil size={16} aria-hidden="true" /> Edit
                    </Link>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
