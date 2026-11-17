import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { MediaManager } from "@/components/admin/media-manager";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  const { supabase } = await requireAdmin("/admin/media");
  const params = await searchParams;
  const { data: apps, error } = await supabase
    .from("apps")
    .select("*")
    .order("name");
  if (error) throw new Error("Daftar media belum dapat dimuat.");
  const app = apps.find((a) => a.id === (params.app ?? apps[0]?.id));
  if (params.app && !app) notFound();
  const back = (
    <div className="admin-toolbar">
      <Link className="back-link" href="/admin/apps">
        <ArrowLeft size={17} aria-hidden="true" /> Kembali ke Aplikasi
      </Link>
    </div>
  );
  if (!app)
    return (
      <>
        {back}
        <p className="panel panel-empty">
          Tambahkan aplikasi terlebih dahulu untuk mengelola media.
        </p>
      </>
    );
  const { data: media, error: mediaError } = await supabase
    .from("app_media")
    .select("*")
    .eq("app_id", app.id)
    .order("sort_order");
  if (mediaError) throw new Error("Media belum dapat dimuat.");
  const { data: files, error: storageError } = await supabase.storage
    .from("app-media")
    .list(app.id, { limit: 100, sortBy: { column: "name", order: "asc" } });
  const registered = new Set(media.map((m) => m.storage_path));
  const unused = (files ?? [])
    .filter((f) => f.id && !registered.has(app.id + "/" + f.name))
    .map((f) => app.id + "/" + f.name);
  return (
    <>
      {back}
      <form className="panel inline-form" action="/admin/media">
        <label className="field">
          <span>Pilih aplikasi</span>
          <select name="app" defaultValue={app.id}>
            {apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.status})
              </option>
            ))}
          </select>
        </label>
        <button className="button button-outline">Tampilkan</button>
      </form>
      {storageError && (
        <p className="notice notice-warn">
          Daftar file Storage belum dapat dimuat. Media yang terdaftar tetap
          ditampilkan.
        </p>
      )}
      <MediaManager key={app.id} app={app} media={media} unused={unused} />
      <p className="help-text">
        Daftar file belum digunakan menampilkan hingga 100 file per aplikasi.
      </p>
    </>
  );
}
