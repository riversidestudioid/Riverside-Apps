import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv, getSupabaseEnv } from "@/lib/supabase/env";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const adminRoute =
    request.nextUrl.pathname === "/admin" ||
    request.nextUrl.pathname.startsWith("/admin/");
  const apiRoute = request.nextUrl.pathname.startsWith("/api/admin/");
  function deny(status: string) {
    const result = apiRoute
      ? NextResponse.json({ error: "Autentikasi diperlukan." }, { status: 401 })
      : NextResponse.redirect(
          new URL(
            "/login?status=" +
              status +
              "&next=" +
              encodeURIComponent(
                request.nextUrl.pathname + request.nextUrl.search,
              ),
            request.url,
          ),
        );
    response.cookies.getAll().forEach((c) => result.cookies.set(c));
    result.headers.set("Cache-Control", "private, no-store");
    return result;
  }
  if (!hasSupabaseEnv())
    return adminRoute || apiRoute ? deny("setup") : response;
  const { url, key } = getSupabaseEnv();
  const db = createServerClient(url, key, {
    cookieOptions: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  try {
    const { data, error } = await db.auth.getClaims();
    if ((adminRoute || apiRoute) && (error || !data?.claims))
      return deny("expired");
  } catch {
    if (adminRoute || apiRoute) return deny("expired");
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: ["/admin/:path*", "/login", "/auth/:path*", "/api/admin/:path*"],
};
