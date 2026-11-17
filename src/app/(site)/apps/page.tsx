import { redirect } from "next/navigation";
import { catalogParams, catalogUrl } from "@/lib/catalog/validation";
import { CatalogBrowser } from "@/components/catalog";
import { getCatalog } from "@/lib/catalog/queries";

export const metadata = {
  title: "Aplikasi",
  description:
    "Jelajahi aplikasi dan web app Riverside Studio untuk gereja, sekolah, bisnis, dan organisasi.",
};

export default async function Apps({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = catalogParams(await searchParams);
  const data = await getCatalog({ ...params, page: String(params.page) });
  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));
  if (params.page > lastPage)
    redirect(catalogUrl("/apps", { ...params, page: lastPage }));
  return (
    <main id="main" className="page container">
      <header className="page-head">
        <h1>Aplikasi</h1>
        <p>
          Aplikasi dan web app siap pakai dari Riverside Studio. Informasi
          harga dan akses tersedia di masing-masing aplikasi.
        </p>
      </header>
      <CatalogBrowser
        apps={data.apps}
        categories={data.categories}
        total={data.total}
        pageSize={data.pageSize}
        params={params}
      />
    </main>
  );
}
