import { z } from "zod";
export const settingsSchema = z.object({
  site_name: z.string().trim().min(1).max(60),
  tagline: z.string().trim().min(1).max(100),
  support_email: z.union([z.email().max(200), z.literal("")]),
  support_whatsapp: z
    .string()
    .regex(
      /^$|^[1-9][0-9]{7,14}$/,
      "Gunakan nomor internasional, hanya angka tanpa +.",
    )
    .max(15),
});
export type PublicSettings = z.infer<typeof settingsSchema>;
export const defaultSettings: PublicSettings = {
  site_name: "Riverside Apps",
  tagline: "by Riverside Studio",
  support_email: "",
  support_whatsapp: "",
};
