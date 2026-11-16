"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, ChevronDown } from "lucide-react";
import { categories } from "@/lib/catalog/data";
export function Brand() {
  return (
    <Link href="/" className="brand">
      <span>Riverside Apps</span>
      <small>by Riverside Studio</small>
    </Link>
  );
}
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav
          aria-label="Navigasi utama"
          className={open ? "navigation is-open" : "navigation"}
        >
          <Link href="/" onClick={() => setOpen(false)} className="home-link">
            Beranda
          </Link>
          <Link href="/apps" onClick={() => setOpen(false)}>
            Jelajahi Aplikasi
          </Link>
          <details>
            <summary>
              Kategori <ChevronDown size={15} />
            </summary>
            <div className="dropdown">
              {categories.slice(1).map((c) => (
                <Link
                  key={c.slug}
                  href={`/apps?category=${c.slug}`}
                  onClick={() => setOpen(false)}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </details>
          <Link href="/harga" onClick={() => setOpen(false)}>
            Harga
          </Link>
          <Link href="/custom" onClick={() => setOpen(false)}>
            Pesan Custom
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
            Daftar
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
export function SiteFooter() {
  return (
    <footer className="site-footer container">
      <Brand />
      <nav aria-label="Navigasi footer">
        <Link href="/apps">Aplikasi</Link>
        <Link href="/custom">Pesan Custom</Link>
        <Link href="/privacy">Privasi</Link>
        <Link href="/terms">Syarat Layanan</Link>
      </nav>
      <small>© {new Date().getFullYear()} Riverside Studio</small>
    </footer>
  );
}
