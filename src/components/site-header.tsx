"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SiteSettings } from "@/lib/admin/settings-validation";
import { Brand } from "./brand";

// Two destinations only. Admin login stays at /login (linked from the footer).
const links = [
  { href: "/apps", label: "Aplikasi" },
  { href: "/custom", label: "Custom" },
];

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand
          name={settings.site_name}
          tagline={settings.tagline}
          logoUrl={settings.logoUrl}
        />
        <nav aria-label="Navigasi utama" className="site-nav">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={
                path === l.href || path.startsWith(l.href + "/")
                  ? "page"
                  : undefined
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
