import type { Metadata } from "next";
import { getBootstrap } from "@/lib/server-store";
import { Storefront } from "@/components/storefront";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your Selection",
  description: "Review your furniture selection and request a quotation.",
  alternates: { canonical: "/cart" },
};
export default async function Page() {
  return <Storefront initial={await getBootstrap()} page="cart" />;
}
