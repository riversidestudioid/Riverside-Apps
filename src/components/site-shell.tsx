"use client";
import {
  defaultSettings,
  type PublicSettings,
} from "@/lib/admin/settings-validation";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";
import type { CategoryOption } from "@/lib/catalog/data";
export function Brand({
  settings = defaultSettings,
}: {
  settings?: PublicSettings;
}) {
  return (
    <Link href="/" className="brand">
      <svg className="brand-mark" viewBox="0 0 56 58" aria-hidden="true">
        <defs>
          <linearGradient id="brand-gradient" x2="1" y2="1">
            <stop stopColor="#00b7aa" />
            <stop offset="1" stopColor="#006575" />
          </linearGradient>
        </defs>
        <path
          d="M14 3H34C59 3 60 33 37 36L54 54H37L17 32H28C43 32 45 16 30 16H12C1 16 2 3 14 3ZM8 26Q18 20 23 21L18 49Q14 56 2 56L5 35Q5 29 8 26Z"
          fill="url(#brand-gradient)"
        />
      </svg>
      <span>{settings.site_name}</span>
      <small>{settings.tagline}</small>
    </Link>
  );
}
export function SiteHeader({
  settings = defaultSettings,
}: {
  categories?: CategoryOption[];
  settings?: PublicSettings;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand settings={settings} />
        <nav
          aria-label="Navigasi utama"
          className={open ? "navigation is-open" : "navigation"}
        >
          <Link href="/" onClick={() => setOpen(false)} className="home-link">
            Beranda
          </Link>
          <Link href="/apps" onClick={() => setOpen(false)}>
            Aplikasi
          </Link>
          <Link href="/harga" onClick={() => setOpen(false)}>
            Harga
          </Link>
          <Link href="/custom" onClick={() => setOpen(false)}>
            Custom
          </Link>
        </nav>
        <div className="header-actions">
          <Link
            className="icon-button"
            href="/apps#search"
            aria-label="Cari aplikasi"
          >
            <Search size={22} />
          </Link>
          <Link href="/login" className="button secondary small">
            Masuk
          </Link>
          <Link href="/register" className="button small">
            Buat Akun
          </Link>
        </div>
        <button
          className="menu-toggle icon-button"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
export function SiteFooter({
  settings = defaultSettings,
}: {
  settings?: PublicSettings;
}) {
  return (
    <footer className="site-footer container">
      <Brand settings={settings} />
      <nav aria-label="Navigasi footer">
        <Link href="/apps">Aplikasi</Link>
        <Link href="/custom">Pesan Custom</Link>
        <Link href="/privacy">Privasi</Link>
        <Link href="/terms">Syarat Layanan</Link>
      </nav>
      <div>
        {settings.support_email && (
          <a href={`mailto:${settings.support_email}`}>
            {settings.support_email}
          </a>
        )}
        {settings.support_whatsapp && (
          <a
            href={`https://wa.me/${settings.support_whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        )}
        <small>© {new Date().getFullYear()} Riverside Studio</small>
      </div>
    </footer>
  );
}
