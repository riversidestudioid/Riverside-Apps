import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database";
import { getSupabaseEnv } from "./env";
// Never forward admin cookies into the public catalog. RLS executes as anon even for admins.
export function createPublicClient() {
  const { url, key } = getSupabaseEnv();
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
          signal: init?.signal ?? AbortSignal.timeout(8000),
        }),
    },
  });
}
