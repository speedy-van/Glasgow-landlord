import type { Metadata } from "next";
import { getBootstrap } from "@/lib/server-store";
import { Storefront } from "@/components/storefront";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Furniture & Appliances",
  description:
    "Explore living room, bedroom and dining furniture, with appliance options for your property. Confirm specifications, availability and pricing with our Glasgow team.",
  alternates: { canonical: "/shop" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Landlord Solutions",
    title: "Furniture & Appliances | Landlord Solutions",
    description:
      "Considered pieces for everyday living. Explore the collection and request details for your space.",
    url: "/shop",
    images: [
      {
        url: "/images/soft-living.webp",
        width: 1350,
        height: 1800,
        alt: "A soft grey corner sofa with a warm wood coffee table",
      },
    ],
  },
};
export default async function Page() {
  return <Storefront initial={await getBootstrap()} page="shop" />;
}
