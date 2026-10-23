import type { Metadata } from "next";
import { getBootstrap } from "@/lib/server-store";
import { Storefront } from "@/components/storefront";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Request a Quotation",
  description:
    "Tell our Glasgow team about your rooms, preferred furniture and property requirements. Request a tailored quotation or get in touch to discuss your space.",
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Landlord Solutions",
    title: "Request a Quotation | Landlord Solutions",
    description:
      "A considered space starts with a conversation. Tell us about your property and the furniture you have in mind.",
    url: "/contact",
    images: [
      {
        url: "/images/sage-living.webp",
        width: 1350,
        height: 1800,
        alt: "A warm neutral sofa in a thoughtfully furnished living room",
      },
    ],
  },
};
export default async function Page() {
  return <Storefront initial={await getBootstrap()} page="contact" />;
}
