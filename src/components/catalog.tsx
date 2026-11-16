"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { categories, type AppProduct } from "@/lib/catalog/data";
import { Icon } from "./icon";
export function Catalog({
  apps,
  preview = false,
  initialQuery = "",
  initialCategory = "semua",
}: {
  apps: AppProduct[];
  preview?: boolean;
  initialQuery?: string;
  initialCategory?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const input = useRef<HTMLInputElement>(null);
  const shortcut = useSyncExternalStore(
    () => () => {},
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K"),
    () => "Ctrl K",
  );
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        !target.closest('input,textarea,[contenteditable="true"]')
      ) {
        event.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  function update(q: string, c: string) {
    setQuery(q);
    setCategory(c);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (c !== "semua") params.set("category", c);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${params.size ? "?" + params : ""}`,
    );
  }
  const filtered = apps.filter(
    (a) =>
      (category === "semua" || a.category === category) &&
      `${a.name} ${a.tagline} ${a.description}`
        .toLocaleLowerCase("id")
        .includes(query.toLocaleLowerCase("id")),
  );
  return (
    <section className="catalog container" aria-label="Katalog aplikasi">
      <div className="search-box" id="search">
        <Search aria-hidden="true" />
        <label className="sr-only" htmlFor="app-search">
          Cari aplikasi
        </label>
        <input
          ref={input}
          id="app-search"
          placeholder="Cari aplikasi, tools, atau solusi..."
          value={query}
          onChange={(e) => update(e.target.value, category)}
        />
        {query ? (
          <button
            className="icon-button"
            aria-label="Hapus pencarian"
            onClick={() => update("", category)}
          >
            <X size={18} />
          </button>
        ) : (
          <kbd>{shortcut}</kbd>
        )}
      </div>
      <div className="categories" aria-label="Filter kategori">
        {categories.map((c) => (
          <button
            key={c.slug}
            aria-pressed={category === c.slug}
            className={`category ${category === c.slug ? "active" : ""}`}
            onClick={() => update(query, c.slug)}
          >
            <Icon name={c.icon} />
            <span>{c.name}</span>
          </button>
        ))}
      </div>
      <div className="section-heading">
        <div>
          <h2>Aplikasi Unggulan</h2>
          <p>Pilihan aplikasi untuk berbagai kebutuhan digital Anda.</p>
        </div>
        <Link className="text-link" href="/apps">
          Lihat Semua Aplikasi <ArrowRight size={18} />
        </Link>
      </div>
      {preview && (
        <p className="preview-note">
          Preview desain · 3 contoh produk draft, belum tersedia untuk digunakan
          atau dibeli.
        </p>
      )}
      <div className="product-grid" aria-live="polite">
        {filtered.map((a) => (
          <article className="product-card" key={a.slug}>
            <div className="product-body">
              <div className={`product-icon ${a.icon}`}>
                <Icon name={a.icon} size={42} />
              </div>
              <div>
                <div className="product-title">
                  <h3>{a.name}</h3>
                  <span className="badge">Draft</span>
                </div>
                <p className="tagline">{a.tagline}</p>
                <p>{a.description}</p>
              </div>
            </div>
            <div className="product-actions">
              <Link className="button" href={`/apps/${a.slug}`}>
                Lihat Draft <ArrowRight size={17} />
              </Link>
              <button className="button secondary" disabled>
                Segera Hadir
              </button>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="empty-state">
          <Icon name="grid" size={36} />
          <h3>
            {apps.length
              ? "Tidak ada aplikasi yang cocok"
              : "Aplikasi sedang dipersiapkan"}
          </h3>
          <p>
            {apps.length
              ? "Coba kata kunci lain atau hapus filter."
              : "Katalog akan tampil setelah produk siap dipublikasikan."}
          </p>
          {apps.length > 0 && (
            <button
              className="button secondary"
              onClick={() => update("", "semua")}
            >
              Hapus filter
            </button>
          )}
        </div>
      )}
    </section>
  );
}
