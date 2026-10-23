import type { Metadata } from "next";
import { getBootstrap } from "@/lib/server-store";
import { Storefront } from "@/components/storefront";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Furniture Packs",
  description:
    "Plan a coordinated furniture package for a rental property, serviced accommodation, social housing or a personal home. Tell us your requirements for a tailored quotation.",
  alternates: { canonical: "/packages" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Landlord Solutions",
    title: "Furniture Packs | Landlord Solutions",
    description:
      "Bring your rooms together with a considered furniture package, tailored to your property and requirements.",
    url: "/packages",
    images: [
      {
        url: "/images/calm-bedroom.webp",
        width: 1320,
        height: 1455,
        alt: "A coordinated bedroom with an upholstered bed and oak storage",
      },
    ],
  },
};
export default async function Page() {
  return <Storefront initial={await getBootstrap()} page="packages" />;
}
