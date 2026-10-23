import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { authenticationConfigured, administratorEmails } from "@/lib/config";
import { AdminSignIn, AdminUnavailable } from "@/components/admin-auth";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administrator sign in",
  description: "Sign in to the private Glasgow Landlord Solutions workspace.",
  robots: { index: false, follow: false },
};
export default async function Page() {
  if (!authenticationConfigured()) return <AdminUnavailable />;
  let session;
  try {
    session = await getAdminSession();
  } catch {
    return <AdminUnavailable />;
  }
  if (
    session &&
    administratorEmails().includes(session.user.email.toLowerCase())
  )
    redirect("/admin");
  return <AdminSignIn />;
}
