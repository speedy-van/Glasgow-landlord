import type { Metadata, Viewport } from "next";
import { Provider } from "@/components/provider";
import "./globals.css";
import { siteOrigin } from "@/lib/config";
const origin = siteOrigin();
export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: "Furniture & Property Furnishing in Glasgow",
    template: "%s | Furniture & Property Furnishing",
  },
  description:
    "Thoughtfully chosen furniture, appliances and complete furnishing for Glasgow landlords, serviced accommodation and homes. Explore our spaces and request a tailored quotation.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: origin,
    title: "Beautiful spaces. Without the hard work.",
    description:
      "Furniture, appliances and complete property furnishing in Glasgow.",
    images: [
      {
        url: "/images/sage-living.webp",
        width: 1350,
        height: 1800,
        alt: "A thoughtfully furnished living space",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.svg", apple: "/apple-icon.png" },
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Admin" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#203b30",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
