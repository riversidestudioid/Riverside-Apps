import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import {
  socialKeys,
  socialLabels,
  type SiteSettings,
} from "@/lib/admin/settings-validation";
import { safeExternalUrl } from "@/lib/catalog/validation";
import { Brand } from "./brand";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const socials = socialKeys
    .map((key) => ({ label: socialLabels[key], url: safeExternalUrl(settings[key]) }))
    .filter((s): s is { label: string; url: string } => Boolean(s.url));
  const hasContact =
    Boolean(settings.support_email || settings.support_whatsapp) ||
    socials.length > 0;
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-about">
          <Brand
            name={settings.site_name}
            tagline={settings.tagline}
            logoUrl={settings.logoUrl}
          />
          {settings.site_description && <p>{settings.site_description}</p>}
        </div>
        <nav aria-label="Navigasi footer" className="footer-col">
          <h2>Navigasi</h2>
          <Link href="/">Beranda</Link>
          <Link href="/apps">Aplikasi</Link>
          <Link href="/custom">Pesan Aplikasi Custom</Link>
        </nav>
        <nav aria-label="Informasi" className="footer-col">
          <h2>Informasi</h2>
          <Link href="/privacy">Kebijakan Privasi</Link>
          <Link href="/terms">Syarat Penggunaan</Link>
        </nav>
        <div className="footer-col">
          <h2>Kontak</h2>
          {settings.support_email && (
            <a href={`mailto:${settings.support_email}`}>
              <Mail size={16} aria-hidden="true" />
              {settings.support_email}
            </a>
          )}
          {settings.support_whatsapp && (
            <a
              href={`https://wa.me/${settings.support_whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={16} aria-hidden="true" />
              WhatsApp
            </a>
          )}
          {socials.map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          ))}
          {!hasContact && <Link href="/custom">Konsultasi melalui formulir</Link>}
        </div>
      </div>
      <div className="container footer-bottom">
        <small>
          © {new Date().getFullYear()} Riverside Studio. Hak cipta dilindungi.
        </small>
      </div>
    </footer>
  );
}
