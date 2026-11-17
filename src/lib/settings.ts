import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  defaultSettings,
  settingsSchema,
} from "@/lib/admin/settings-validation";
export const getSiteSettings = cache(async () => {
  if (!hasSupabaseEnv()) return defaultSettings;
  const { data, error } = await createPublicClient()
    .from("site_settings")
    .select("key,value")
    .retry(false);
  if (error) return defaultSettings;
  const parsed = settingsSchema.safeParse({
    ...defaultSettings,
    ...Object.fromEntries((data ?? []).map((v) => [v.key, v.value])),
  });
  return parsed.success ? parsed.data : defaultSettings;
});
