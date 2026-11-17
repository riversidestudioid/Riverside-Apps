import { getSiteSettings } from "@/lib/settings";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

/** Public header + footer around a page. Settings come from the database when configured. */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <div className="site">
      <SiteHeader settings={settings} />
      {children}
      <SiteFooter settings={settings} />
    </div>
  );
}
