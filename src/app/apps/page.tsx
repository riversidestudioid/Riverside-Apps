import { Catalog } from "@/components/catalog";
import { draftApps } from "@/lib/catalog/data";
export const metadata = { title: "Jelajahi Aplikasi" };
export default async function Apps({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const preview = process.env.NODE_ENV === "development";
  return (
    <main id="main" style={{ paddingTop: 30, minHeight: "65vh" }}>
      <Catalog
        apps={preview ? draftApps : []}
        preview={preview}
        initialQuery={params.q}
        initialCategory={params.category}
      />
    </main>
  );
}
