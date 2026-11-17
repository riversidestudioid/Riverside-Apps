"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "./auth";
import { requestUpdateSchema } from "@/lib/custom/validation";
import type { ActionResult } from "./actions";

function refresh(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  if (id) revalidatePath(`/admin/requests/${id}`);
}

export async function updateCustomRequest(
  input: unknown,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin("/admin/requests");
  const parsed = requestUpdateSchema.safeParse(input);
  if (!parsed.success)
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  const { id, status, admin_notes } = parsed.data;
  const { data, error } = await supabase
    .from("custom_requests")
    .update({ status, admin_notes })
    .eq("id", id)
    .select("id");
  if (error || !data?.length)
    return { error: "Permintaan belum dapat diperbarui." };
  refresh(id);
  return { ok: true, id };
}

export async function deleteCustomRequest(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin("/admin/requests");
  if (!z.uuid().safeParse(id).success) return { error: "ID tidak valid." };
  const { data, error } = await supabase
    .from("custom_requests")
    .delete()
    .eq("id", id)
    .select("id");
  if (error || !data?.length)
    return { error: "Permintaan belum dapat dihapus." };
  refresh();
  return { ok: true };
}
