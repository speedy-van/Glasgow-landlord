import { neon } from "@neondatabase/serverless";
import {
  config,
  siteOrigin,
  authenticationConfigured,
  mediaConfigured,
} from "./config";
import { seedProducts, seedSettings, seedMedia } from "./seed";
import type {
  Bootstrap,
  Product,
  SiteSettings,
  AdminData,
  Integrations,
} from "./domain";
export { config } from "./config";
export function database() {
  const url = config().DATABASE_URL;
  if (!url) throw new ApiError(503, "Connect Neon to enable shared data.");
  return neon(url);
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}
export function integrationStatus(): Integrations {
  const e = config();
  return {
    database: !!e.DATABASE_URL,
    stripe: !!e.STRIPE_SECRET_KEY && !!e.STRIPE_WEBHOOK_SECRET,
    mapbox: !!e.MAPBOX_ACCESS_TOKEN,
    media: mediaConfigured(),
    admin: authenticationConfigured(),
  };
}
export function mapProduct(r: Record<string, unknown>): Product {
  return {
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    category: r.category as Product["category"],
    description: r.description as string,
    finish: r.finish as string,
    pricePence: r.price_pence as number | null,
    stock: r.stock as number | null,
    reserved: r.reserved as number,
    images: r.images as string[],
    active: r.active as boolean,
    featured: r.featured as boolean,
    version: r.version as number,
  };
}
export async function getBootstrap(): Promise<Bootstrap> {
  const integrations = integrationStatus();
  if (!integrations.database)
    return {
      products: seedProducts,
      settings: seedSettings,
      mode: "preview",
      integrations,
      siteUrl: siteOrigin(),
    };
  try {
    const sql = database();
    const [products, settings] = await Promise.all([
      sql`SELECT * FROM products WHERE active=true ORDER BY created_at,id`,
      sql`SELECT data,version FROM site_settings WHERE id=1`,
    ]);
    if (!settings[0]) throw new Error("Schema is not initialized");
    return {
      products: products.map(mapProduct),
      settings: {
        ...settings[0].data,
        version: settings[0].version,
      } as SiteSettings,
      mode: "live",
      integrations,
      siteUrl: siteOrigin(),
    };
  } catch {
    return {
      products: [],
      settings: seedSettings,
      mode: "live",
      integrations,
      siteUrl: siteOrigin(),
      error:
        "The collection is temporarily unavailable. Please try again or call our team.",
    };
  }
}
export async function getAdminData(): Promise<AdminData> {
  const base = await getBootstrap();
  if (base.mode === "preview")
    return { ...base, media: seedMedia, quotes: [], orders: [] };
  const sql = database();
  const [products, media, quotes, orders] = await Promise.all([
    sql`SELECT * FROM products ORDER BY created_at,id`,
    sql`SELECT * FROM media ORDER BY created_at DESC`,
    sql`SELECT * FROM quotes ORDER BY created_at DESC LIMIT 500`,
    sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 500`,
  ]);
  return {
    ...base,
    products: products.map(mapProduct),
    media: [
      ...seedMedia,
      ...media.map((r) => ({ id: r.id, url: r.url, name: r.name, alt: r.alt })),
    ],
    quotes: quotes.map((r) => ({
      ...r.data,
      id: r.id,
      status: r.status,
      createdAt: r.created_at,
    })),
    orders: orders.map((r) => ({
      id: r.id,
      email: r.email,
      status: r.status,
      totalPence: r.total_pence,
      items: r.items,
      createdAt: r.created_at,
    })),
  };
}
