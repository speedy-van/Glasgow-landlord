import type { MetadataRoute } from "next";
import { getBootstrap } from "@/lib/server-store";
import { siteOrigin } from "@/lib/config";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteOrigin();
  const data = await getBootstrap();
  return [
    "",
    "/shop",
    "/packages",
    "/spaces",
    "/about",
    "/contact",
    ...data.products.map((p) => "/shop/" + p.slug),
  ].map((path) => ({
    url: base + path,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
