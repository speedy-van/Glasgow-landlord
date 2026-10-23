import type { Metadata } from "next";
import { getBootstrap } from "@/lib/server-store";
import { Storefront } from "@/components/storefront";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Our Spaces",
  description:
    "Explore thoughtfully furnished living, bedroom and dining spaces.",
  alternates: { canonical: "/spaces" },
};
export default async function Page() {
  return <Storefront initial={await getBootstrap()} page="spaces" />;
}
