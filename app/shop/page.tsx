import type { Metadata } from "next";
import { getBootstrap } from "@/lib/server-store";
import { Storefront } from "@/components/storefront";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Furniture & Appliances",
  description: "Explore furniture and appliance options for your property.",
  alternates: { canonical: "/shop" },
};
export default async function Page() {
  return <Storefront initial={await getBootstrap()} page="shop" />;
}
