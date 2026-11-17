import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  loadCatalog,
  loadCategories,
  loadProduct,
  type CatalogPage,
} from "./repository";
import { allCategory, type CategoryOption } from "./data";
import { catalogParams } from "./validation";

export const catalogPageSize = 12;

export const getCategories = cache(async (): Promise<CategoryOption[]> =>
  hasSupabaseEnv() ? loadCategories(createPublicClient()) : [allCategory],
);

export async function getCatalog(
  input: Record<string, string | string[] | undefined> = {},
  options: { featured?: boolean; pageSize?: number } = {},
) {
  const params = catalogParams(input);
  if (!hasSupabaseEnv())
    return {
      apps: [],
      categories: [allCategory],
      total: 0,
      page: params.page,
      pageSize: options.pageSize ?? catalogPageSize,
      configured: false,
    } satisfies CatalogPage & { categories: CategoryOption[] };
  const [result, categories] = await Promise.all([
    loadCatalog(createPublicClient(), input, {
      pageSize: catalogPageSize,
      ...options,
    }),
    getCategories(),
  ]);
  return { ...result, categories };
}

/** Featured apps for the homepage; falls back to the newest published apps when none are featured. */
export async function getFeaturedApps(limit = 6) {
  const featured = await getCatalog({}, { featured: true, pageSize: limit });
  if (featured.apps.length > 0 || !featured.configured) return featured;
  return getCatalog({ sort: "newest" }, { pageSize: limit });
}

export const getProduct = cache(async (slug: string) =>
  hasSupabaseEnv() ? loadProduct(createPublicClient(), slug) : null,
);
