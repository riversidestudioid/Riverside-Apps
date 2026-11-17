import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/supabase/database";
import {
  loadCatalog,
  loadCategories,
  loadProduct,
} from "../../src/lib/catalog/repository";
import { createCatalogApi } from "../helpers/catalog-api";

test("Supabase SDK + local PostgreSQL/RLS: catalog, search, pricing, category, sort, pagination and detail", async () => {
  const api = await createCatalogApi();
  try {
    const db = createClient<Database>(api.url, "test-only-publishable-key", {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    assert.equal((await loadCategories(db)).length, 8);
    const list = await loadCatalog(db);
    assert.equal(list.total, 2);
    assert.deepEqual(
      list.apps.map((a) => a.slug),
      ["alat-sertifikat-uji", "bisnis-uji"],
    );
    assert.equal(
      (await loadCatalog(db, {}, { featured: true, pageSize: 3 })).apps.length,
      1,
    );
    assert.equal(
      (await loadCatalog(db, { q: "RAHASIA-KATALOG" })).apps[0].slug,
      "alat-sertifikat-uji",
    );
    assert.equal((await loadCatalog(db, { q: "%" })).total, 0);
    assert.equal(
      (await loadCatalog(db, { category: "bisnis" })).apps[0].slug,
      "bisnis-uji",
    );
    assert.equal((await loadCatalog(db, { billing: "monthly" })).total, 1);
    assert.equal(
      (await loadCatalog(db, { sort: "newest" })).apps[0].slug,
      "bisnis-uji",
    );
    assert.equal(
      (await loadCatalog(db, { sort: "name" })).apps[0].slug,
      "alat-sertifikat-uji",
    );
    const page = await loadCatalog(db, { page: "2" }, { pageSize: 1 });
    assert.equal(page.total, 2);
    assert.equal(page.apps[0].slug, "bisnis-uji");
    assert.equal((await loadCatalog(db, { q: "Nama Draft Rahasia" })).total, 0);
    const detail = await loadProduct(db, "alat-sertifikat-uji");
    assert.equal(detail?.plans.length, 4);
    assert.ok(detail?.media.some((m) => m.kind === "youtube"));
    assert.equal(detail?.app.demo_url, "https://example.com/demo");
    assert.equal(await loadProduct(db, "produk-draft-uji"), null);
    assert.equal(await loadProduct(db, "produk-arsip-uji"), null);
    assert.equal(await loadProduct(db, "missing"), null);
    await fetch(api.url + "/__test/empty", { method: "POST" });
    assert.equal((await loadCatalog(db)).total, 0);
    assert.equal(await loadProduct(db, "alat-sertifikat-uji"), null);
  } finally {
    await api.close();
  }
});

test("database failures propagate as safe errors without empty-success fallback", async () => {
  const api = await createCatalogApi();
  try {
    const db = createClient<Database>(api.url, "test-only-key", {
      auth: { persistSession: false },
    });
    await fetch(api.url + "/__test/failure?enabled=1", { method: "POST" });
    await assert.rejects(loadCatalog(db), /Katalog belum dapat dimuat/);
    await assert.rejects(loadCategories(db), /Kategori belum dapat dimuat/);
    await assert.rejects(
      loadProduct(db, "alat-sertifikat-uji"),
      /Aplikasi belum dapat dimuat/,
    );
  } finally {
    await api.close();
  }
});
