import { redirect } from "next/navigation";
import { getAdminData } from "@/lib/server-store";
import { getAdminSession } from "@/lib/auth";
import { authenticationConfigured } from "@/lib/config";
import { AdminUnavailable } from "@/components/admin-auth";
import { requireAdmin } from "@/lib/api";
import { AdminDashboard, AdminAccess } from "@/components/admin-dashboard";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin" },
};
export default async function Page() {
  if (!authenticationConfigured()) return <AdminUnavailable />;
  const session = await getAdminSession();
  if (!session) redirect("/admin/sign-in");
  try {
    await requireAdmin();
  } catch {
    return <AdminAccess />;
  }
  return <AdminDashboard initial={await getAdminData()} />;
}
