import type { Metadata } from "next";
import { getBootstrap } from "@/lib/server-store";
import { Storefront } from "@/components/storefront";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Request a Quotation",
  description:
    "Tell us about your space and request a tailored furniture quotation.",
  alternates: { canonical: "/contact" },
};
export default async function Page() {
  return <Storefront initial={await getBootstrap()} page="contact" />;
}
