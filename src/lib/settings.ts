import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  defaultSettings,
  logoPublicUrl,
  settingsSchema,
  type SiteSettings,
} from "@/lib/admin/settings-validation";

const fallback: SiteSettings = { ...defaultSettings, logoUrl: null };

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!hasSupabaseEnv()) return fallback;
  // Settings are live database data: render at request time, never at build time.
  await connection();
  const { data, error } = await createPublicClient()
    .from("site_settings")
    .select("key,value")
    .retry(false);
  if (error) return fallback;
  const parsed = settingsSchema.safeParse({
    ...defaultSettings,
    ...Object.fromEntries((data ?? []).map((v) => [v.key, v.value])),
  });
  if (!parsed.success) return fallback;
  return {
    ...parsed.data,
    logoUrl: logoPublicUrl(
      parsed.data.logo_path,
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
  };
});
