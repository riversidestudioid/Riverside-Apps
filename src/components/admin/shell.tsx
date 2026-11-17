"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Grid2X2,
  Plus,
  Folder,
  Image,
  Tags,
  Settings,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { logout } from "@/app/login/actions";
const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/apps", label: "Kelola Aplikasi", icon: Grid2X2 },
  { href: "/admin/apps/new", label: "Tambah Aplikasi", icon: Plus },
  { href: "/admin/categories", label: "Kelola Kategori", icon: Folder },
  { href: "/admin/media", label: "Kelola Media", icon: Image },
  { href: "/admin/plans", label: "Paket Harga", icon: Tags },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings },
];
export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <main id="main" className="admin-workspace container">
      <aside className={"admin-nav-panel " + (open ? "expanded" : "")}>
        <div className="admin-nav-brand">
          <strong>
            Riverside<span>Admin Workspace</span>
          </strong>
          <button
            className="icon-button admin-nav-toggle"
            aria-label="Tutup navigasi admin"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        <nav aria-label="Navigasi admin">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="admin-nav-bottom">
          <Link href="/apps">
            <ExternalLink size={17} />
            Lihat Katalog Publik
          </Link>
          <form action={logout}>
            <button className="admin-logout">
              <LogOut size={17} />
              Keluar
            </button>
          </form>
        </div>
      </aside>
      <div className="admin-main-panel">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <button
              className="icon-button admin-nav-toggle"
              aria-label="Buka navigasi admin"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <Menu />
            </button>
            <span>
              Riverside Studio /{" "}
              <strong>
                {links.find((l) => l.href === path)?.label ?? "Editor Aplikasi"}
              </strong>
            </span>
          </div>
          <span className="admin-identity">
            <span className="admin-avatar">
              {email.slice(0, 1).toUpperCase() || "A"}
            </span>
            <span>
              {email}
              <small>Administrator</small>
            </span>
          </span>
        </header>
        <section className="admin-content">{children}</section>
      </div>
    </main>
  );
}
