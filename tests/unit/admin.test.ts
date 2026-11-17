import { test } from "node:test";
import assert from "node:assert/strict";
import { safeAdminPath } from "../../src/lib/admin/session";
import {
  validateMediaFile,
  storedPathValid,
  matchesFileSignature,
} from "../../src/lib/admin/media-validation";
import { settingsSchema } from "../../src/lib/admin/settings-validation";
test("redirects stay within admin, including protocol-relative and backslash attacks", () => {
  assert.equal(safeAdminPath("/admin/apps?draft=1"), "/admin/apps?draft=1");
  for (const value of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/apps",
    "/administrator",
    "/admin/../../outside",
  ])
    assert.equal(safeAdminPath(value), "/admin");
});
test("media checks MIME, size, original extension, storage path and actual bytes", () => {
  const file = { name: "icon.png", type: "image/png", size: 68 };
  assert.equal(validateMediaFile(file, "icon"), null);
  assert.ok(validateMediaFile({ ...file, name: "icon.svg" }, "icon"));
  assert.ok(validateMediaFile({ ...file, size: 6 * 1024 * 1024 }, "icon"));
  assert.equal(
    storedPathValid(
      "11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.png",
      "11111111-1111-4111-8111-111111111111",
      "image/png",
    ),
    true,
  );
  assert.equal(
    matchesFileSignature(
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      "image/png",
    ),
    true,
  );
  assert.equal(
    matchesFileSignature(new TextEncoder().encode("<svg></svg>"), "image/png"),
    false,
  );
  assert.equal(
    matchesFileSignature(new TextEncoder().encode("<html>"), "image/jpeg"),
    false,
  );
});
test("settings accept optional official contacts and reject malformed contacts", () => {
  assert.ok(
    settingsSchema.safeParse({
      site_name: "Riverside Apps",
      tagline: "by Studio",
      support_email: "",
      support_whatsapp: "",
    }).success,
  );
  assert.equal(
    settingsSchema.safeParse({
      site_name: "Name",
      tagline: "Tagline",
      support_email: "javascript:alert(1)",
      support_whatsapp: "+62123",
    }).success,
    false,
  );
});
