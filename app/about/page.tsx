import type { Metadata } from "next";
import { getBootstrap } from "@/lib/server-store";
import { Storefront } from "@/components/storefront";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Our Approach",
  description:
    "A personal approach to furniture, appliances and complete property furnishing.",
  alternates: { canonical: "/about" },
};
export default async function Page() {
  return <Storefront initial={await getBootstrap()} page="about" />;
}
