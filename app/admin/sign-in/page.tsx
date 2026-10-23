import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { authenticationConfigured, administratorEmails } from "@/lib/config";
import { AdminSignIn, AdminUnavailable } from "@/components/admin-auth";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administrator sign in",
  robots: { index: false, follow: false },
};
export default async function Page() {
  if (!authenticationConfigured()) return <AdminUnavailable />;
  const session = await getAdminSession();
  if (
    session &&
    administratorEmails().includes(session.user.email.toLowerCase())
  )
    redirect("/admin");
  return <AdminSignIn />;
}
