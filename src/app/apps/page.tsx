import { redirect } from "next/navigation";
import { catalogUrl } from "@/lib/catalog/validation";
import { catalogParams } from "@/lib/catalog/validation";
import { Catalog } from "@/components/catalog";
import { getCatalog } from "@/lib/catalog/queries";
export const metadata = { title: "Jelajahi Aplikasi" };
export default async function Apps({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    billing?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = catalogParams(await searchParams);
  const data = await getCatalog({ ...params, page: String(params.page) });
  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));
  if (params.page > lastPage)
    redirect(catalogUrl("/apps", { ...params, page: lastPage }));
  return (
    <main id="main" style={{ paddingTop: 30, minHeight: "65vh" }}>
      <Catalog
        apps={data.apps}
        categoryOptions={data.categories}
        total={data.total}
        page={data.page}
        pageSize={data.pageSize}
        fullCatalog
        initialQuery={params.q}
        initialCategory={params.category}
        initialBilling={params.billing}
        initialSort={params.sort}
      />
    </main>
  );
}
