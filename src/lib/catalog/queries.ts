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
import { allCategory } from "./data";
import { catalogParams } from "./validation";
export const getCategories = cache(async () =>
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
      pageSize: options.pageSize ?? 24,
      configured: false,
    } satisfies CatalogPage & { categories: (typeof allCategory)[] };
  const [result, categories] = await Promise.all([
    loadCatalog(createPublicClient(), input, options),
    getCategories(),
  ]);
  return { ...result, categories };
}
export const getProduct = cache(async (slug: string) =>
  hasSupabaseEnv() ? loadProduct(createPublicClient(), slug) : null,
);
