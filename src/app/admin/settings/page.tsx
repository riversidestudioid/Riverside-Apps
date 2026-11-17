import { requireAdmin } from "@/lib/admin/auth";
import { SettingsForm } from "@/components/admin/settings-form";
import {
  defaultSettings,
  logoPublicUrl,
  settingsSchema,
} from "@/lib/admin/settings-validation";

export default async function Settings() {
  const { supabase } = await requireAdmin("/admin/settings");
  const { data, error } = await supabase
    .from("site_settings")
    .select("key,value");
  if (error) throw new Error("Pengaturan belum dapat dimuat.");
  const parsed = settingsSchema.safeParse({
    ...defaultSettings,
    ...Object.fromEntries(data.map((row) => [row.key, row.value])),
  });
  const settings = parsed.success ? parsed.data : defaultSettings;
  return (
    <SettingsForm
      settings={{
        ...settings,
        logoUrl: logoPublicUrl(
          settings.logo_path,
          process.env.NEXT_PUBLIC_SUPABASE_URL,
        ),
      }}
    />
  );
}
