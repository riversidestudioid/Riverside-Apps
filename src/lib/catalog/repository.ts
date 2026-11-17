import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Application,
  Category,
  Media,
  Plan,
} from "@/lib/supabase/database";
import { z } from "zod";
import { allCategory, type AppProduct } from "./data";
import { catalogParams, httpsUrl } from "./validation";
export type ProductDetail = {
  app: Application;
  category: Category;
  media: Media[];
  plans: Plan[];
};
export type CatalogPage = {
  apps: AppProduct[];
  total: number;
  page: number;
  pageSize: number;
  configured: boolean;
};
const plan = z.object({
  id: z.uuid(),
  app_id: z.uuid(),
  name: z.string(),
  billing_type: z.enum(["free", "one_time", "monthly", "yearly"]),
  price_idr: z.number().int().nonnegative().nullable(),
  currency: z.literal("IDR"),
  license_policy: z.string(),
  features: z.array(z.string()),
  is_active: z.boolean(),
});
const product = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  category: z.string(),
  tagline: z.string(),
  description: z.string(),
  icon: z.string(),
  status: z.literal("published"),
  isVisible: z.literal(true),
  featured: z.boolean(),
  createdAt: z.string(),
  demoUrl: z.string().nullable(),
  launchUrl: z.string().nullable(),
  thumbnailId: z.uuid().nullable(),
  iconId: z.uuid().nullable(),
  plans: z.array(plan),
});
const catalogResult = z.object({
  items: z.array(product),
  total: z.number().int().nonnegative(),
});
export async function loadCategories(db: SupabaseClient<Database>) {
  const { data, error } = await db
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("name")
    .retry(false);
  if (error)
    throw new Error("Kategori belum dapat dimuat. Silakan coba kembali.");
  return [allCategory, ...(data ?? [])];
}
export async function loadCatalog(
  db: SupabaseClient<Database>,
  input: Record<string, string | string[] | undefined> = {},
  options: { featured?: boolean; pageSize?: number } = {},
): Promise<CatalogPage> {
  const params = catalogParams(input);
  const pageSize = Math.max(1, Math.min(48, options.pageSize ?? 24));
  const { data, error } = await db
    .rpc("catalog_apps", {
      p_query: params.q,
      p_category: params.category,
      p_billing: params.billing,
      p_sort: params.sort,
      p_page: params.page,
      p_page_size: pageSize,
      p_featured: options.featured ?? false,
    })
    .retry(false);
  if (error)
    throw new Error("Katalog belum dapat dimuat. Silakan coba kembali.");
  const result = catalogResult.safeParse(data);
  if (!result.success) throw new Error("Data katalog belum dapat ditampilkan.");
  return {
    apps: result.data.items.map((a) => ({
      ...a,
      demoUrl: a.demoUrl && httpsUrl(a.demoUrl) ? a.demoUrl : null,
      launchUrl: a.launchUrl && httpsUrl(a.launchUrl) ? a.launchUrl : null,
    })),
    total: result.data.total,
    page: params.page,
    pageSize,
    configured: true,
  };
}
export async function loadProduct(
  db: SupabaseClient<Database>,
  slug: string,
): Promise<ProductDetail | null> {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null;
  const { data: app, error } = await db
    .from("apps")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_visible", true)
    .maybeSingle()
    .retry(false);
  if (error) throw new Error("Aplikasi belum dapat dimuat.");
  if (!app || !app.category_id) return null;
  const [category, media, plans] = await Promise.all([
    db
      .from("categories")
      .select("*")
      .eq("id", app.category_id)
      .eq("is_active", true)
      .maybeSingle()
      .retry(false),
    db
      .from("app_media")
      .select("*")
      .eq("app_id", app.id)
      .order("sort_order")
      .order("id")
      .retry(false),
    db
      .from("plans")
      .select("*")
      .eq("app_id", app.id)
      .eq("is_active", true)
      .order("price_idr")
      .order("id")
      .retry(false),
  ]);
  if (category.error || media.error || plans.error)
    throw new Error("Detail aplikasi belum dapat dimuat.");
  if (!category.data) return null;
  return {
    app: {
      ...app,
      demo_url: app.demo_url && httpsUrl(app.demo_url) ? app.demo_url : null,
      launch_url:
        app.launch_url && httpsUrl(app.launch_url) ? app.launch_url : null,
    },
    category: category.data,
    media: media.data ?? [],
    plans: plans.data ?? [],
  };
}
