import { requireAdmin } from "@/lib/admin/auth";
import { SettingsForm } from "@/components/admin/settings-form";
import {
  defaultSettings,
  settingsSchema,
} from "@/lib/admin/settings-validation";
export default async function Settings() {
  const { supabase } = await requireAdmin("/admin/settings");
  const { data, error } = await supabase
    .from("site_settings")
    .select("key,value");
  if (error) throw new Error("Pengaturan belum dapat dimuat.");
  const settings = settingsSchema.parse({
    ...defaultSettings,
    ...Object.fromEntries(data.map((row) => [row.key, row.value])),
  });
  return (
    <>
      <h1>Pengaturan Dasar</h1>
      <p>Atur identitas dan kontak resmi yang ditampilkan kepada pengunjung.</p>
      <SettingsForm settings={settings} />
    </>
  );
}
