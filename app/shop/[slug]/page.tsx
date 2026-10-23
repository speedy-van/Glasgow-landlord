import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getBootstrap } from "@/lib/server-store";
import { Storefront } from "@/components/storefront";
export const dynamic = "force-dynamic";
const loadCollection = cache(getBootstrap);
const imageDimensions: Record<string, { width: number; height: number }> = {
  "/images/sage-living.webp": { width: 1350, height: 1800 },
  "/images/soft-living.webp": { width: 1350, height: 1800 },
  "/images/oak-dining.webp": { width: 1350, height: 1800 },
  "/images/oak-bedroom.webp": { width: 1320, height: 1409 },
  "/images/calm-bedroom.webp": { width: 1320, height: 1455 },
  "/images/brand-reference.webp": { width: 1254, height: 1254 },
};
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadCollection();
  const p = data.products.find((p) => p.slug === slug);
  if (!p) {
    return {
      title: "Piece unavailable",
      description:
        "This piece is currently unavailable. Explore the collection or ask our team about a similar option.",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: "/shop/" + p.slug },
    openGraph: {
      type: "website",
      locale: "en_GB",
      siteName: "Landlord Solutions",
      title: p.title + " | Landlord Solutions",
      description: p.description,
      url: "/shop/" + p.slug,
      images: p.images.map((url) => ({
        url,
        alt: p.title,
        ...imageDimensions[url],
      })),
    },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await loadCollection();
  if (!data.error && !data.products.some((p) => p.slug === slug)) notFound();
  return <Storefront initial={data} page="product" slug={slug} />;
}
