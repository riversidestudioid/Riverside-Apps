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
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <a className="skip-link" href="#main">
          Lewati ke konten
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
