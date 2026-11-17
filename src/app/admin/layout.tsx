import { requireAdmin } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/shell";

export const metadata = {
  title: "Dashboard Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();
  return <AdminShell email={user.email}>{children}</AdminShell>;
}
