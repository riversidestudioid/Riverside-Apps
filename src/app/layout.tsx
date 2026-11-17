import "@fontsource-variable/plus-jakarta-sans";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Riverside Apps — Solusi Aplikasi & Web App",
    template: "%s | Riverside Apps",
  },
  description:
    "Katalog aplikasi dan web app Riverside Studio, serta layanan pembuatan aplikasi custom untuk gereja, sekolah, bisnis, dan organisasi.",
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <a className="skip-link" href="#main">
          Lewati ke konten
        </a>
        {children}
      </body>
    </html>
  );
}
