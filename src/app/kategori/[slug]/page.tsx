import { notFound, redirect } from "next/navigation";
import { getCategories } from "@/lib/catalog/queries";
import { catalogParams, catalogUrl } from "@/lib/catalog/validation";
export default async function CategoryRoute({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const categories = await getCategories();
  if (!categories.some((c) => c.slug === slug && c.slug !== "semua"))
    notFound();
  redirect(
    catalogUrl("/apps", {
      ...catalogParams(await searchParams),
      category: slug,
    }),
  );
}
