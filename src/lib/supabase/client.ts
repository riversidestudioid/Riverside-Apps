"use client";
import type { Database } from "./database";
import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";
export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient<Database>(url, key, {
    cookieOptions: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  });
}
