import { test } from "node:test";
import assert from "node:assert/strict";
import {
  youtubeId,
  httpsUrl,
  planSchema,
  validateUpload,
  formatPrice,
} from "../../src/lib/catalog/validation";
test("YouTube accepts supported HTTPS hosts and rejects embeds from untrusted hosts", () => {
  assert.equal(
    youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    "dQw4w9WgXcQ",
  );
  assert.equal(youtubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  for (const v of [
    "javascript:alert(1)",
    "https://youtube.com.attacker.test/watch?v=dQw4w9WgXcQ",
    "http://youtu.be/dQw4w9WgXcQ",
    "https://evil.test/a",
  ])
    assert.equal(youtubeId(v), null);
});
test("price rules distinguish unset/free/paid integer IDR", () => {
  const p = {
    name: "Paket",
    billing_type: "free",
    price_idr: 0,
    license_policy: "Gratis",
    features: [],
    is_active: true,
  };
  assert.ok(planSchema.safeParse(p).success);
  assert.ok(planSchema.safeParse({ ...p, price_idr: null }).success);
  for (const data of [
    { ...p, price_idr: 1 },
    { ...p, billing_type: "monthly", price_idr: 0 },
    { ...p, billing_type: "monthly", price_idr: 1.5 },
    { ...p, price_idr: -1 },
  ])
    assert.equal(planSchema.safeParse(data).success, false);
  assert.equal(formatPrice(null, "one_time"), "Harga belum ditetapkan");
  assert.equal(formatPrice(0, "free"), "Gratis");
});
test("uploads reject active image formats, wrong type and oversized files", () => {
  assert.equal(
    validateUpload({ type: "image/png", size: 1024 }, "thumbnail"),
    null,
  );
  assert.ok(validateUpload({ type: "image/svg+xml", size: 1024 }, "thumbnail"));
  assert.ok(
    validateUpload({ type: "image/png", size: 6 * 1024 * 1024 }, "thumbnail"),
  );
  assert.ok(validateUpload({ type: "text/html", size: 50 }, "video"));
  assert.ok(
    validateUpload({ type: "video/mp4", size: 51 * 1024 * 1024 }, "video"),
  );
  assert.equal(httpsUrl("https://user:pass@example.com"), false);
  assert.equal(httpsUrl("javascript:alert(1)"), false);
});

test("public query normalization handles repeated parameters and unknown filter values", async () => {
  const { catalogParams } = await import("../../src/lib/catalog/validation");
  assert.deepEqual(
    catalogParams({
      q: ["sertifikat", "other"],
      category: "../admin",
      billing: "bogus",
      sort: "injection",
    }),
    {
      q: "sertifikat",
      category: "semua",
      billing: "",
      sort: "featured",
      page: 1,
    },
  );
  assert.equal(catalogParams({ q: "a".repeat(500) }).q.length, 200);
});
