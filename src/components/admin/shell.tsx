"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  CodeXml,
  ExternalLink,
  House,
  Package,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { logout } from "@/lib/admin/auth-actions";
import { BrandMark } from "@/components/brand";

const nav = [
  { href: "/admin", label: "Dashboard", icon: House, exact: true },
  { href: "/admin/apps", label: "Aplikasi", icon: Package, also: ["/admin/categories", "/admin/media"] },
  { href: "/admin/requests", label: "Permintaan Custom", icon: CodeXml },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings },
];

const titles: { match: RegExp; title: string; subtitle: string }[] = [
  { match: /^\/admin$/, title: "Dashboard", subtitle: "Kelola aplikasi dan permintaan custom." },
  { match: /^\/admin\/apps\/new$/, title: "Tambah Aplikasi", subtitle: "Simpan sebagai draft, lengkapi media, lalu publish." },
  { match: /^\/admin\/apps\/[^/]+$/, title: "Edit Aplikasi", subtitle: "Perbarui informasi, media, dan status publikasi." },
  { match: /^\/admin\/apps$/, title: "Aplikasi", subtitle: "Semua aplikasi di katalog, termasuk draft dan arsip." },
  { match: /^\/admin\/categories$/, title: "Kategori", subtitle: "Kelompokkan aplikasi agar mudah dicari pengunjung." },
  { match: /^\/admin\/media$/, title: "File Media", subtitle: "Periksa dan bersihkan file yang tidak terpakai." },
  { match: /^\/admin\/requests\/[^/]+$/, title: "Detail Permintaan", subtitle: "Kebutuhan, kontak, status, dan catatan internal." },
  { match: /^\/admin\/requests$/, title: "Permintaan Custom", subtitle: "Permintaan pembuatan aplikasi dari pengunjung." },
  { match: /^\/admin\/settings$/, title: "Pengaturan", subtitle: "Identitas situs, kontak resmi, dan sosial media." },
];

function active(path: string, item: (typeof nav)[number]) {
  if (item.exact) return path === item.href;
  return [item.href, ...(item.also ?? [])].some(
    (h) => path === h || path.startsWith(h + "/"),
  );
}

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const heading = titles.find((t) => t.match.test(path)) ?? titles[0];
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div className="admin-app">
      <aside
        id="admin-sidebar"
        className={open ? "admin-sidebar is-open" : "admin-sidebar"}
        aria-label="Sidebar admin"
      >
        <div className="admin-brand">
          <BrandMark className="admin-brand-mark" />
          <span>
            <strong>Riverside Apps</strong>
            <small>Admin Panel</small>
          </span>
          <button
            type="button"
            className="admin-close"
            aria-label="Tutup navigasi admin"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav aria-label="Navigasi admin" className="admin-nav">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active(path, item) ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <Icon size={20} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-foot">
          <Link href="/" target="_blank">
            <ExternalLink size={17} aria-hidden="true" />
            Lihat Website
          </Link>
        </div>
      </aside>
      {open && (
        <button
          type="button"
          className="admin-scrim"
          aria-label="Tutup navigasi admin"
          tabIndex={-1}
          onClick={() => setOpen(false)}
        />
      )}
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-toggle"
            aria-label="Buka navigasi admin"
            aria-expanded={open}
            aria-controls="admin-sidebar"
            onClick={() => setOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="admin-title">
            <h1>{heading.title}</h1>
            <p>{heading.subtitle}</p>
          </div>
          <details className="admin-user">
            <summary>
              <span className="admin-avatar" aria-hidden="true">
                {(email.slice(0, 1) || "A").toUpperCase()}
              </span>
              <span className="admin-user-text">
                <strong>Admin</strong>
                <small>Riverside Studio</small>
              </span>
              <ChevronDown size={18} aria-hidden="true" />
              <span className="sr-only">Menu akun admin</span>
            </summary>
            <div className="admin-user-menu">
              <p title={email}>{email}</p>
              <form action={logout}>
                <button type="submit">
                  <LogOut size={17} aria-hidden="true" />
                  Keluar
                </button>
              </form>
            </div>
          </details>
        </header>
        <main id="main" className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
