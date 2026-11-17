import Link from "next/link";
import {
  socialKeys,
  socialLabels,
  type SiteSettings,
} from "@/lib/admin/settings-validation";
import { safeExternalUrl } from "@/lib/catalog/validation";
import { Brand } from "./brand";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  // Only official contacts filled in by the admin are shown; nothing is invented.
  const contacts = [
    settings.support_email && {
      label: settings.support_email,
      href: `mailto:${settings.support_email}`,
      external: false,
    },
    settings.support_whatsapp && {
      label: "WhatsApp",
      href: `https://wa.me/${settings.support_whatsapp}`,
      external: true,
    },
    ...socialKeys.map((key) => {
      const url = safeExternalUrl(settings[key]);
      return url && { label: socialLabels[key], href: url, external: true };
    }),
  ].filter((c): c is { label: string; href: string; external: boolean } =>
    Boolean(c),
  );
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-about">
          <Brand
            name={settings.site_name}
            tagline={settings.tagline}
            logoUrl={settings.logoUrl}
          />
          {settings.site_description && <p>{settings.site_description}</p>}
        </div>
        <nav aria-label="Navigasi footer" className="footer-links">
          <Link href="/apps">Aplikasi</Link>
          <Link href="/custom">Custom</Link>
          <Link href="/privacy">Kebijakan Privasi</Link>
          <Link href="/terms">Syarat Penggunaan</Link>
        </nav>
      </div>
      <div className="container footer-bottom">
        <small>© {new Date().getFullYear()} Riverside Studio</small>
        {contacts.length > 0 && (
          <ul className="footer-contacts" aria-label="Kontak resmi">
            {contacts.map((c) => (
              <li key={c.href}>
                <a
                  href={c.href}
                  {...(c.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        )}
        <Link href="/login" className="footer-admin" rel="nofollow">
          Admin
        </Link>
      </div>
    </footer>
  );
}
