"use server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import {
  customRequestSchema,
  minimumFillMs,
  type CustomRequestField,
} from "./validation";

export type CustomRequestState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Partial<Record<CustomRequestField, string>>;
};

const fields = [
  "name",
  "email",
  "whatsapp",
  "app_type",
  "project_name",
  "description",
] as const;

async function clientFingerprint() {
  const h = await headers();
  const ip =
    h.get("x-nf-client-connection-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  // Only a one-way hash leaves this function; the raw IP is never stored.
  return createHash("sha256")
    .update("riverside-custom-request:" + ip)
    .digest("hex");
}

export async function submitCustomRequest(
  _previous: CustomRequestState,
  form: FormData,
): Promise<CustomRequestState> {
  if (!hasSupabaseEnv())
    return {
      status: "error",
      message:
        "Formulir belum dapat menerima permintaan karena layanan belum dikonfigurasi.",
    };
  // Honeypot: real visitors never see or fill this field. Drop silently.
  if (String(form.get("company_website") ?? "").trim())
    return {
      status: "success",
      message: "Terima kasih, permintaan Anda sudah kami terima.",
    };
  const elapsed = Number(form.get("fill_ms"));
  if (!Number.isFinite(elapsed) || elapsed < minimumFillMs)
    return {
      status: "error",
      message:
        "Formulir terkirim terlalu cepat. Periksa kembali isian Anda lalu kirim ulang.",
    };
  const raw = Object.fromEntries(
    fields.map((f) => [f, String(form.get(f) ?? "")]),
  );
  const parsed = customRequestSchema.safeParse({
    ...raw,
    privacy_consent: form.get("privacy_consent") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: CustomRequestState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as CustomRequestField | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: "error",
      message: "Periksa kembali isian yang ditandai.",
      fieldErrors,
    };
  }
  try {
    const { error } = await createPublicClient()
      .rpc("submit_custom_request", {
        payload: {
          ...parsed.data,
          client_fingerprint: await clientFingerprint(),
        },
      })
      .retry(false);
    if (error) {
      if (error.code === "PT429" || /too many requests/i.test(error.message))
        return {
          status: "error",
          message:
            "Terlalu banyak permintaan dari koneksi atau email ini. Silakan coba lagi dalam 1 jam.",
        };
      return {
        status: "error",
        message:
          "Permintaan belum dapat disimpan. Periksa kembali isian Anda atau coba beberapa saat lagi.",
      };
    }
  } catch {
    return {
      status: "error",
      message: "Layanan sedang tidak dapat dihubungi. Silakan coba lagi.",
    };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  return {
    status: "success",
    message: "Terima kasih, permintaan Anda sudah kami terima.",
  };
}
