"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, UserRound, X } from "lucide-react";
import type { SiteSettings } from "@/lib/admin/settings-validation";
import { Brand } from "./brand";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/apps", label: "Aplikasi" },
  { href: "/custom", label: "Custom" },
];

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
}

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand
          name={settings.site_name}
          tagline={settings.tagline}
          logoUrl={settings.logoUrl}
          onNavigate={close}
        />
        <nav
          id="site-navigation"
          aria-label="Navigasi utama"
          className={open ? "site-nav is-open" : "site-nav"}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              aria-current={isActive(path, l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/login" className="nav-login-mobile" onClick={close}>
            <UserRound size={18} aria-hidden="true" /> Masuk Admin
          </Link>
        </nav>
        <Link href="/login" className="login-button">
          <UserRound size={18} aria-hidden="true" />
          Masuk
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          aria-controls="site-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}
