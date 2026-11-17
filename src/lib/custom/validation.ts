import { z } from "zod";
import type {
  CustomRequestAppType,
  CustomRequestStatus,
} from "@/lib/supabase/database";

export const appTypeLabels: Record<CustomRequestAppType, string> = {
  website: "Website",
  web_app: "Web App",
  mobile_app: "Mobile App",
  desktop_app: "Desktop App",
};
export const appTypes = Object.keys(appTypeLabels) as CustomRequestAppType[];

export const requestStatusLabels: Record<CustomRequestStatus, string> = {
  new: "Baru",
  contacted: "Dihubungi",
  discussion: "Dalam Diskusi",
  accepted: "Diterima",
  completed: "Selesai",
  rejected: "Ditolak",
};
export const requestStatuses = Object.keys(
  requestStatusLabels,
) as CustomRequestStatus[];

/** Accepts local Indonesian (08…) and international (+62…) input; returns digits only. */
export function normalizeWhatsapp(value: string) {
  let digits = value.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  return digits;
}

export const customRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(120, "Nama maksimal 120 karakter."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Email terlalu panjang.")
    .pipe(z.email("Masukkan alamat email yang valid.")),
  whatsapp: z
    .string()
    .max(30, "Nomor WhatsApp tidak valid.")
    .transform(normalizeWhatsapp)
    .pipe(
      z
        .string()
        .regex(
          /^[1-9][0-9]{7,14}$/,
          "Masukkan nomor WhatsApp yang valid, contoh 0812xxxxxxx.",
        ),
    ),
  app_type: z.enum(appTypes as [CustomRequestAppType], {
    error: "Pilih jenis aplikasi.",
  }),
  project_name: z
    .string()
    .trim()
    .min(2, "Nama proyek minimal 2 karakter.")
    .max(150, "Nama proyek maksimal 150 karakter."),
  description: z
    .string()
    .trim()
    .min(20, "Jelaskan kebutuhan minimal 20 karakter.")
    .max(5000, "Deskripsi maksimal 5.000 karakter."),
  privacy_consent: z.literal(true, {
    error: "Anda perlu menyetujui Kebijakan Privasi.",
  }),
});
export type CustomRequestInput = z.infer<typeof customRequestSchema>;
export type CustomRequestField = keyof CustomRequestInput;

export const requestUpdateSchema = z.object({
  id: z.uuid(),
  status: z.enum(requestStatuses as [CustomRequestStatus]),
  admin_notes: z.string().max(5000, "Catatan maksimal 5.000 karakter."),
});

/** Minimum time a human needs to fill the form; faster submissions are treated as automated. */
export const minimumFillMs = 3000;
