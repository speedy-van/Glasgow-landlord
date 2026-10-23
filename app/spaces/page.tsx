import type { Metadata } from "next";
import { getBootstrap } from "@/lib/server-store";
import { Storefront } from "@/components/storefront";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Our Spaces",
  description:
    "Explore thoughtfully furnished living, bedroom and dining spaces. Find inspiration for your property, then ask about current furniture and finish options.",
  alternates: { canonical: "/spaces" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Landlord Solutions",
    title: "Our Spaces | Landlord Solutions",
    description:
      "Warm textures, considered details and everyday living. Find furnishing inspiration for your next space.",
    url: "/spaces",
    images: [
      {
        url: "/images/oak-dining.webp",
        width: 1350,
        height: 1800,
        alt: "A warm wood dining table with four upholstered chairs",
      },
    ],
  },
};
export default async function Page() {
  return <Storefront initial={await getBootstrap()} page="spaces" />;
}
