import type { Metadata } from "next";
import { getBootstrap } from "@/lib/server-store";
import { Storefront } from "@/components/storefront";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your Selection",
  description:
    "Review your furniture selection, adjust quantities and request a tailored quotation for your property.",
  alternates: { canonical: "/cart" },
  robots: { index: false, follow: false },
};
export default async function Page() {
  return <Storefront initial={await getBootstrap()} page="cart" />;
}
