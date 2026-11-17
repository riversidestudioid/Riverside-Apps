import { z } from "zod";
import { httpsUrl } from "@/lib/catalog/validation";

const httpsOrEmpty = z
  .string()
  .trim()
  .max(500)
  .refine((v) => !v || httpsUrl(v), "Gunakan URL HTTPS yang valid.");

export const socialKeys = [
  "instagram_url",
  "facebook_url",
  "youtube_url",
  "tiktok_url",
  "linkedin_url",
] as const;
export type SocialKey = (typeof socialKeys)[number];
export const socialLabels: Record<SocialKey, string> = {
  instagram_url: "Instagram",
  facebook_url: "Facebook",
  youtube_url: "YouTube",
  tiktok_url: "TikTok",
  linkedin_url: "LinkedIn",
};

export const logoPathPattern = /^logo\/[a-f0-9-]{36}\.(jpg|png|webp)$/;

// Every key mirrors the database whitelist. No secret can be stored here.
export const settingsSchema = z.object({
  site_name: z.string().trim().min(1, "Nama website wajib diisi.").max(60),
  tagline: z.string().trim().min(1, "Subteks wajib diisi.").max(100),
  site_description: z.string().trim().max(300).default(""),
  logo_path: z
    .string()
    .refine((v) => v === "" || logoPathPattern.test(v))
    .default(""),
  support_email: z.union([z.email().max(200), z.literal("")]),
  support_whatsapp: z
    .string()
    .regex(
      /^$|^[1-9][0-9]{7,14}$/,
      "Gunakan nomor internasional, hanya angka tanpa +.",
    )
    .max(15),
  instagram_url: httpsOrEmpty.default(""),
  facebook_url: httpsOrEmpty.default(""),
  youtube_url: httpsOrEmpty.default(""),
  tiktok_url: httpsOrEmpty.default(""),
  linkedin_url: httpsOrEmpty.default(""),
});
export type PublicSettings = z.infer<typeof settingsSchema>;
export type SiteSettings = PublicSettings & { logoUrl: string | null };

export const defaultSettings: PublicSettings = {
  site_name: "Riverside Apps",
  tagline: "by Riverside Studio",
  site_description:
    "Temukan aplikasi siap pakai atau buat aplikasi custom sesuai kebutuhan gereja, sekolah, bisnis, dan organisasi.",
  logo_path: "",
  support_email: "",
  support_whatsapp: "",
  instagram_url: "",
  facebook_url: "",
  youtube_url: "",
  tiktok_url: "",
  linkedin_url: "",
};

export function logoPublicUrl(path: string, supabaseUrl: string | undefined) {
  if (!path || !supabaseUrl || !logoPathPattern.test(path)) return null;
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/site-assets/${path}`;
}
