import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";
// Read-only Server Component client. Auth mutation and session refresh are a later sprint.
export async function createClient() {
  const { url, key } = getSupabaseEnv();
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: { getAll: () => store.getAll() },
  });
}
