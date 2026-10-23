import type { Metadata } from "next";
import { getBootstrap } from "@/lib/server-store";
import { Storefront } from "@/components/storefront";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBootstrap();
  const p = data.products.find((p) => p.slug === slug);
  return {
    title: p?.title ?? "Collection",
    description: p?.description,
    alternates: { canonical: "/shop/" + slug },
    openGraph: { images: p?.images.map((url) => ({ url, alt: p.title })) },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Storefront initial={await getBootstrap()} page="product" slug={slug} />
  );
}
