import type { Metadata, Viewport } from "next";
import { Provider } from "@/components/provider";
import { EmotionRegistry } from "@/components/emotion-registry";
import "./globals.css";
import { siteOrigin } from "@/lib/config";
const origin = siteOrigin();
export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: "Landlord Solutions | Furniture & Furnishing in Glasgow",
    template: "%s | Landlord Solutions",
  },
  description:
    "Furniture, appliances and considered furnishing packages for Glasgow properties. Explore living, bedroom and dining collections, then request a tailored quotation.",
  applicationName: "Landlord Solutions",
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: origin,
    siteName: "Landlord Solutions",
    title: "Landlord Solutions | Furniture & Furnishing in Glasgow",
    description:
      "Thoughtfully chosen furniture and furnishing packages for Glasgow properties. Find inspiration for your space and request a tailored quotation.",
    images: [
      {
        url: "/images/sage-living.webp",
        width: 1350,
        height: 1800,
        alt: "A warm neutral corner sofa in a sage green living room",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Landlord Solutions",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#253d35",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <EmotionRegistry>
          <Provider>{children}</Provider>
        </EmotionRegistry>
      </body>
    </html>
  );
}
