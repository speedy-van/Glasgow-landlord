import { redirect } from "next/navigation";
import { ApiError, getAdminData } from "@/lib/server-store";
import { getAdminSession } from "@/lib/auth";
import { authenticationConfigured } from "@/lib/config";
import { AdminUnavailable } from "@/components/admin-auth";
import { requireAdmin } from "@/lib/api";
import { AdminDashboard, AdminAccess } from "@/components/admin-dashboard";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administration",
  description:
    "The private Glasgow Landlord Solutions administration workspace.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin" },
};
export default async function Page() {
  if (!authenticationConfigured()) return <AdminUnavailable />;
  let session;
  try {
    session = await getAdminSession();
  } catch {
    return <AdminUnavailable />;
  }
  if (!session) redirect("/admin/sign-in");
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401)
      redirect("/admin/sign-in");
    return error instanceof ApiError && error.status === 403 ? (
      <AdminAccess />
    ) : (
      <AdminUnavailable />
    );
  }
  try {
    return <AdminDashboard initial={await getAdminData()} />;
  } catch {
    return <AdminUnavailable />;
  }
}
