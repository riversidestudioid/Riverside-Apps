import { getSiteSettings } from "@/lib/settings";
import { getCategories } from "@/lib/catalog/queries";
import "@fontsource-variable/plus-jakarta-sans";
import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
export const metadata: Metadata = {
  title: {
    default: "Riverside Apps — by Riverside Studio",
    template: "%s | Riverside Apps",
  },
  description:
    "Aplikasi, tools, dan web app untuk gereja, pendidikan, bisnis, dan kebutuhan digital Anda.",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [categories, settings] = await Promise.all([
    getCategories().catch(() => []),
    getSiteSettings(),
  ]);
  return (
    <html lang="id">
      <body>
        <a className="skip-link" href="#main">
          Lewati ke konten
        </a>
        <SiteHeader categories={categories} settings={settings} />
        {children}
        <SiteFooter settings={settings} />
      </body>
    </html>
  );
}
