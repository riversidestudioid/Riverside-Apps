"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useTransition, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import {
  allCategory,
  type AppProduct,
  type CategoryOption,
} from "@/lib/catalog/data";
import {
  billingLabels,
  formatPrice,
  catalogUrl,
} from "@/lib/catalog/validation";
import { Icon } from "./icon";
export function Catalog({
  apps,
  total = apps.length,
  page = 1,
  pageSize = 24,
  initialQuery = "",
  initialCategory = "semua",
  categoryOptions = [allCategory],
  fullCatalog = false,
  initialBilling = "",
  initialSort = "featured",
}: {
  apps: AppProduct[];
  total?: number;
  page?: number;
  pageSize?: number;
  initialQuery?: string;
  initialCategory?: string;
  categoryOptions?: CategoryOption[];
  fullCatalog?: boolean;
  initialBilling?: string;
  initialSort?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSent = useRef(initialQuery);
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const shortcut = useSyncExternalStore(
    () => () => {},
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K"),
    () => "Ctrl K",
  );
  useEffect(() => {
    if (input.current && initialQuery !== lastSent.current) {
      input.current.value = initialQuery;
      lastSent.current = initialQuery;
    }
  }, [initialQuery]);
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
    return () => {
      window.removeEventListener("keydown", handler);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  function update(
    q: string,
    c = initialCategory,
    b = initialBilling,
    sort = initialSort,
    nextPage = 1,
  ) {
    if (timer.current) clearTimeout(timer.current);
    lastSent.current = q;
    start(() =>
      router.push(
        catalogUrl(pathname, {
          q,
          category: c,
          billing: b,
          sort,
          page: nextPage,
        }),
        { scroll: false },
      ),
    );
  }
  const q = () => input.current?.value ?? initialQuery;
  const filtered = Boolean(
    initialQuery || initialCategory !== "semua" || initialBilling,
  );
  const title = fullCatalog ? "Jelajahi Aplikasi" : "Aplikasi Unggulan";
  return (
    <section
      className={`catalog container ${fullCatalog ? "" : "home-catalog"}`}
      aria-label="Katalog aplikasi"
    >
      <form
        className="search-box"
        id="search"
        action={pathname}
        onSubmit={(e) => {
          e.preventDefault();
          update(q());
        }}
      >
        <Search aria-hidden="true" />
        <label className="sr-only" htmlFor="app-search">
          Cari aplikasi
        </label>
        <input
          ref={input}
          id="app-search"
          name="q"
          defaultValue={initialQuery}
          maxLength={200}
          placeholder="Cari aplikasi, tools, atau solusi..."
          onChange={(e) => {
            const value = e.target.value;
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => update(value), 300);
          }}
        />
        <input type="hidden" name="category" value={initialCategory} />
        <input type="hidden" name="billing" value={initialBilling} />
        <input type="hidden" name="sort" value={initialSort} />
        <button
          className="icon-button search-submit"
          type="submit"
          aria-label="Jalankan pencarian"
        >
          <Search size={18} />
        </button>
        {initialQuery ? (
          <button
            type="button"
            className="icon-button"
            aria-label="Hapus pencarian"
            onClick={() => {
              if (input.current) input.current.value = "";
              update("");
            }}
          >
            <X size={18} />
          </button>
        ) : (
          <kbd>{shortcut}</kbd>
        )}
      </form>
      <div className="categories" aria-label="Filter kategori">
        {categoryOptions.map((c) => (
          <button
            key={c.slug}
            aria-pressed={initialCategory === c.slug}
            className={`category ${initialCategory === c.slug ? "active" : ""}`}
            onClick={() => update(q(), c.slug)}
            disabled={pending || !ready}
          >
            <Icon name={c.icon} />
            <span>{c.name}</span>
          </button>
        ))}
      </div>
      <div className="section-heading">
        <div className={fullCatalog ? "" : "sr-only"}>
          {fullCatalog ? <h1>{title}</h1> : <h2>{title}</h2>}
          <p>Pilihan aplikasi untuk berbagai kebutuhan digital Anda.</p>
        </div>
        {!fullCatalog && (
          <Link href="/apps" className="text-link">
            Lihat Semua Aplikasi <ArrowRight size={18} />
          </Link>
        )}
      </div>
      {fullCatalog && (
        <div className="catalog-filters">
          <label>
            Model akses
            <select
              value={initialBilling}
              disabled={pending || !ready}
              onChange={(e) => update(q(), initialCategory, e.target.value)}
            >
              <option value="">Semua model akses</option>
              {Object.entries(billingLabels).map(([v, l]) => (
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Urutkan
            <select
              value={initialSort}
              disabled={pending || !ready}
              onChange={(e) =>
                update(q(), initialCategory, initialBilling, e.target.value)
              }
            >
              <option value="featured">Unggulan</option>
              <option value="newest">Terbaru</option>
              <option value="name">Nama A–Z</option>
            </select>
          </label>
        </div>
      )}
      <p role="status" className="catalog-status">
        {pending
          ? "Memuat aplikasi..."
          : fullCatalog
            ? `${total} aplikasi ditemukan`
            : ""}
      </p>
      <div className="product-grid" aria-busy={pending}>
        {apps.map((a) =>
          !fullCatalog ? (
            <article className="product-card compact-product" key={a.id}>
              <div className={`product-icon ${a.icon}`}>
                {a.iconId || a.thumbnailId ? (
                  <Image
                    unoptimized
                    src={`/media/${a.iconId ?? a.thumbnailId}`}
                    alt=""
                    width={80}
                    height={80}
                  />
                ) : (
                  <Icon name={a.icon} size={40} />
                )}
              </div>
              <div className="compact-copy">
                <h3>{a.name}</h3>
                <p>{a.tagline || a.description}</p>
                <span className="compact-category">
                  {categoryOptions.find((c) => c.slug === a.category)?.name ??
                    a.category}
                </span>
              </div>
              <div className="compact-meta">
                {a.plans[0] ? (
                  <div
                    className={`compact-price ${a.plans[0].billing_type === "free" ? "is-free" : ""}`}
                  >
                    {a.plans[0].billing_type !== "free" && (
                      <small>
                        {a.plans.length > 1
                          ? "Mulai dari"
                          : a.plans[0].billing_type === "one_time"
                            ? "Sekali beli"
                            : "Berlangganan"}
                      </small>
                    )}
                    <strong>
                      {formatPrice(
                        a.plans[0].price_idr,
                        a.plans[0].billing_type,
                      )}
                    </strong>
                  </div>
                ) : (
                  <span className="compact-price">Segera hadir</span>
                )}
                <Link
                  className="compact-open"
                  href={`/apps/${a.slug}`}
                  aria-label={`Lihat detail ${a.name}`}
                >
                  <ArrowRight size={20} />
                </Link>
              </div>
            </article>
          ) : (
            <article className="product-card" key={a.id}>
              <div className="product-body">
                <div className={`product-icon ${a.icon}`}>
                  {a.iconId || a.thumbnailId ? (
                    <Image
                      unoptimized
                      src={`/media/${a.iconId ?? a.thumbnailId}`}
                      alt=""
                      width={74}
                      height={74}
                    />
                  ) : (
                    <Icon name={a.icon} size={42} />
                  )}
                </div>
                <div>
                  <div className="product-title">
                    <h3>{a.name}</h3>
                    <span className="badge">
                      {a.plans.some((p) => p.billing_type === "free")
                        ? "Gratis"
                        : a.plans.length
                          ? "Berbayar"
                          : "Segera Hadir"}
                    </span>
                  </div>
                  <p className="tagline">{a.tagline}</p>
                  <p>{a.description}</p>
                </div>
              </div>
              {a.plans.length > 0 && (
                <p className="card-price">
                  {formatPrice(a.plans[0].price_idr, a.plans[0].billing_type)}
                </p>
              )}
              <div className="product-actions">
                <Link className="button" href={`/apps/${a.slug}`}>
                  Lihat Detail <ArrowRight size={17} />
                </Link>
                {a.demoUrl ? (
                  <a
                    className="button secondary"
                    href={a.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Coba Demo
                  </a>
                ) : a.launchUrl &&
                  a.plans.some(
                    (p) => p.billing_type === "free" && p.price_idr === 0,
                  ) ? (
                  <a
                    className="button secondary"
                    href={a.launchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Gunakan Sekarang
                  </a>
                ) : null}
              </div>
            </article>
          ),
        )}
      </div>
      {apps.length === 0 && (
        <div className="empty-state">
          <Icon name="grid" size={36} />
          <h3>
            {filtered
              ? "Tidak ada aplikasi yang cocok"
              : fullCatalog
                ? "Katalog sedang dipersiapkan"
                : "Belum ada aplikasi unggulan"}
          </h3>
          <p>
            {filtered
              ? "Coba kata kunci lain atau hapus filter."
              : "Aplikasi akan ditampilkan setelah siap dipublikasikan. Jelajahi katalog untuk melihat pilihan yang tersedia."}
          </p>
          {filtered ? (
            <button
              className="button secondary"
              onClick={() => {
                if (input.current) input.current.value = "";
                update("", "semua", "", "featured");
              }}
            >
              Hapus filter
            </button>
          ) : !fullCatalog ? (
            <Link href="/apps" className="button secondary">
              Jelajahi Katalog
            </Link>
          ) : null}
        </div>
      )}
      {fullCatalog && total > pageSize && (
        <nav className="catalog-pagination" aria-label="Halaman katalog">
          {page > 1 ? (
            <Link
              className="button secondary"
              href={catalogUrl(pathname, {
                q: initialQuery,
                category: initialCategory,
                billing: initialBilling,
                sort: initialSort,
                page: page - 1,
              })}
            >
              Sebelumnya
            </Link>
          ) : (
            <span />
          )}
          <span>
            Halaman {page} dari {Math.max(1, Math.ceil(total / pageSize))}
          </span>
          {page * pageSize < total ? (
            <Link
              className="button secondary"
              href={catalogUrl(pathname, {
                q: initialQuery,
                category: initialCategory,
                billing: initialBilling,
                sort: initialSort,
                page: page + 1,
              })}
            >
              Selanjutnya
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </section>
  );
}
