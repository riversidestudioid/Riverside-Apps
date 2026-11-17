"use client";
import Link from "next/link";
import { useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Search, X } from "lucide-react";
import type { AppProduct, CategoryOption } from "@/lib/catalog/data";
import { catalogUrl } from "@/lib/catalog/validation";
import { AppCard } from "./app-card";

type Params = {
  q: string;
  category: string;
  billing: string;
  sort: string;
  page: number;
};

export function CatalogBrowser({
  apps,
  categories,
  total,
  pageSize,
  params,
}: {
  apps: AppProduct[];
  categories: CategoryOption[];
  total: number;
  pageSize: number;
  params: Params;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (input.current && document.activeElement !== input.current)
      input.current.value = params.q;
  }, [params.q]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        !target.closest('input,textarea,select,[contenteditable="true"]')
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

  function go(next: Partial<Params>) {
    if (timer.current) clearTimeout(timer.current);
    const url = catalogUrl(pathname, {
      ...params,
      q: input.current?.value.trim() ?? params.q,
      page: 1,
      ...next,
    });
    start(() => router.push(url, { scroll: false }));
  }

  const filtered = Boolean(params.q || params.category !== "semua");
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const pageUrl = (page: number) => catalogUrl(pathname, { ...params, page });

  return (
    <section className="catalog" aria-label="Katalog aplikasi">
      <div className="catalog-toolbar">
        <form
          className="search-field"
          role="search"
          action={pathname}
          onSubmit={(e) => {
            e.preventDefault();
            go({});
          }}
        >
          <Search size={20} aria-hidden="true" className="search-icon" />
          <label className="sr-only" htmlFor="app-search">
            Cari aplikasi
          </label>
          <input
            ref={input}
            id="app-search"
            name="q"
            type="search"
            defaultValue={params.q}
            maxLength={200}
            autoComplete="off"
            placeholder="Cari aplikasi..."
            onChange={(e) => {
              const value = e.target.value;
              if (timer.current) clearTimeout(timer.current);
              timer.current = setTimeout(() => go({ q: value.trim() }), 350);
            }}
          />
          {params.category !== "semua" && (
            <input type="hidden" name="category" value={params.category} />
          )}
          {params.q && (
            <button
              type="button"
              className="icon-button"
              aria-label="Hapus pencarian"
              onClick={() => {
                if (input.current) input.current.value = "";
                go({ q: "" });
              }}
            >
              <X size={18} />
            </button>
          )}
          <button className="button button-sm" type="submit">
            Cari
          </button>
        </form>
        <div className="filter-pills" role="group" aria-label="Filter kategori">
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              aria-pressed={params.category === c.slug}
              className="pill"
              disabled={pending}
              onClick={() => go({ category: c.slug })}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <p role="status" className="result-count">
        {pending
          ? "Memuat aplikasi..."
          : total > 0
            ? `${total} aplikasi ditemukan`
            : ""}
      </p>

      {apps.length > 0 && (
        <div className="app-grid" aria-busy={pending}>
          {apps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              categories={categories}
              headingLevel={2}
            />
          ))}
        </div>
      )}

      {apps.length === 0 && (
        <div className="empty-state">
          <LayoutGrid size={32} aria-hidden="true" />
          <h2>
            {filtered
              ? "Tidak ada aplikasi yang cocok"
              : "Katalog sedang dipersiapkan"}
          </h2>
          <p>
            {filtered
              ? "Coba kata kunci lain atau pilih kategori berbeda."
              : "Aplikasi akan tampil setelah dipublikasikan. Butuh aplikasi khusus? Ceritakan kebutuhan Anda."}
          </p>
          {filtered ? (
            <button
              type="button"
              className="button button-outline"
              onClick={() => {
                if (input.current) input.current.value = "";
                go({ q: "", category: "semua" });
              }}
            >
              Hapus filter
            </button>
          ) : (
            <Link href="/custom" className="button button-outline">
              Pesan Aplikasi Custom
            </Link>
          )}
        </div>
      )}

      {total > pageSize && (
        <nav className="pagination" aria-label="Halaman katalog">
          {params.page > 1 ? (
            <Link className="button button-outline button-sm" href={pageUrl(params.page - 1)}>
              Sebelumnya
            </Link>
          ) : (
            <span />
          )}
          <span>
            Halaman {params.page} dari {lastPage}
          </span>
          {params.page < lastPage ? (
            <Link className="button button-outline button-sm" href={pageUrl(params.page + 1)}>
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
