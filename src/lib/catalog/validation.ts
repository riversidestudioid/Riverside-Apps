import { z } from "zod";
export const billingLabels = {
  free: "Gratis",
  one_time: "Sekali beli",
  monthly: "Bulanan",
  yearly: "Tahunan",
};
export function httpsUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}
export function youtubeId(value: string) {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" || u.username || u.password) return null;
    let id: string | null = null;
    if (u.hostname === "youtu.be") id = u.pathname.slice(1);
    if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(u.hostname)
    ) {
      id =
        u.pathname === "/watch"
          ? u.searchParams.get("v")
          : (u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/)?.[1] ?? null);
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
const url = z
  .string()
  .max(2000)
  .refine((v) => !v || httpsUrl(v), "Gunakan URL HTTPS yang valid.");
export const planSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    billing_type: z.enum(["free", "one_time", "monthly", "yearly"]),
    price_idr: z.number().int().min(0).max(2147483647).nullable(),
    license_policy: z.string().trim().max(2000),
    features: z.array(z.string().max(250)).max(30),
    is_active: z.boolean(),
  })
  .superRefine((p, ctx) => {
    if (
      p.price_idr !== null &&
      (p.billing_type === "free" ? p.price_idr !== 0 : p.price_idr <= 0)
    )
      ctx.addIssue({
        code: "custom",
        message: "Paket gratis harus Rp0; paket berbayar harus lebih dari Rp0.",
        path: ["price_idr"],
      });
  });
export const appSchema = z
  .object({
    id: z.uuid(),
    revision: z.number().int().min(0),
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    name: z.string().trim().min(1).max(120),
    tagline: z.string().trim().max(200),
    short_description: z.string().trim().max(500),
    description: z.string().trim().max(30000),
    key_features: z
      .array(z.string().trim().min(1).max(250))
      .max(30)
      .default([]),
    category_id: z.union([z.uuid(), z.literal("")]),
    platform: z.enum(["web", "desktop", "mobile"]),
    status: z.enum(["draft", "published", "archived"]),
    is_visible: z.boolean(),
    is_featured: z.boolean(),
    featured_order: z.number().int().min(0).max(10000),
    demo_url: url,
    launch_url: url,
    plans: z.array(planSchema).max(12),
  })
  .superRefine((a, ctx) => {
    if (
      a.status === "published" &&
      (!a.is_visible ||
        !a.category_id ||
        a.description.length < 20 ||
        !a.launch_url ||
        !a.plans.some((p) => p.is_active) ||
        a.plans.some(
          (p) =>
            p.is_active &&
            (p.price_idr === null || p.license_policy.length < 5),
        ))
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Publikasi memerlukan kategori aktif, deskripsi, URL aplikasi, visibilitas, dan harga serta lisensi paket aktif yang lengkap.",
      });
  });
export type AppInput = z.infer<typeof appSchema>;
export const uploadKinds = ["thumbnail", "screenshot", "video"] as const;
export function validateUpload(
  file: { type: string; size: number },
  kind: string,
) {
  const image = ["image/jpeg", "image/png", "image/webp"];
  const video = ["video/mp4", "video/webm"];
  if (!(kind === "video" ? video : image).includes(file.type))
    return "Format file tidak didukung.";
  if (file.size <= 0 || file.size > (kind === "video" ? 50 : 5) * 1024 * 1024)
    return "Ukuran maksimum gambar 5 MB dan video 50 MB.";
  return null;
}
export function formatPrice(price: number | null, type: string) {
  if (price === null) return "Harga belum ditetapkan";
  if (type === "free") return "Gratis";
  return (
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price) +
    (type === "monthly"
      ? " / bulan"
      : type === "yearly"
        ? " / tahun"
        : " sekali beli")
  );
}
export function catalogParams(
  input: Record<string, string | string[] | undefined>,
) {
  const one = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? "") : "";
  const category = one(input.category);
  const billing = one(input.billing);
  const sort = one(input.sort);
  return {
    q: one(input.q).trim().slice(0, 200),
    page: /^\d+$/.test(one(input.page))
      ? Math.max(1, Math.min(1000, Number(one(input.page))))
      : 1,
    category: /^[a-z0-9]+(-[a-z0-9]+)*$/.test(category) ? category : "semua",
    billing: Object.hasOwn(billingLabels, billing) ? billing : "",
    sort: ["featured", "newest", "name"].includes(sort) ? sort : "featured",
  };
}

export function catalogUrl(
  path: string,
  params: {
    q: string;
    category: string;
    billing: string;
    sort: string;
    page: number;
  },
) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category !== "semua") search.set("category", params.category);
  if (params.billing) search.set("billing", params.billing);
  if (params.sort !== "featured") search.set("sort", params.sort);
  if (params.page > 1) search.set("page", String(params.page));
  return path + (search.size ? "?" + search : "");
}
