import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";
import type { Database } from "./database";
export async function createClient() {
  const { url, key } = getSupabaseEnv();
  const store = await cookies();
  return createServerClient<Database>(url, key, {
    cookieOptions: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          /* Server Component: cookie refresh is handled by proxy. */
        }
      },
    },
  });
}
