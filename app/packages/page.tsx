import type { Metadata } from "next";
import { getBootstrap } from "@/lib/server-store";
import { Storefront } from "@/components/storefront";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Furniture Packs",
  description:
    "Tailored furniture packs for rental properties, serviced accommodation and social housing.",
  alternates: { canonical: "/packages" },
};
export default async function Page() {
  return <Storefront initial={await getBootstrap()} page="packages" />;
}
