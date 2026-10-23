import type { Metadata } from "next";
import { getBootstrap } from "@/lib/server-store";
import { Storefront } from "@/components/storefront";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: {
    absolute: "Landlord Solutions | Furniture & Furnishing in Glasgow",
  },
  description:
    "Considered furniture for spaces that feel like home. Explore Glasgow furnishing collections and packages for rental properties, serviced accommodation and personal homes.",
  alternates: { canonical: "/" },
};
export default async function Home() {
  const data = await getBootstrap();
  return <Storefront initial={data} />;
}
