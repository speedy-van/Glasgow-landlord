import { z } from "zod";

export const categories = [
  "Living room",
  "Bedroom",
  "Dining",
  "Appliances",
] as const;
export const productSchema = z.object({
  id: z.string().min(1).max(80),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100),
  title: z.string().trim().min(2).max(120),
  category: z.enum(categories),
  description: z.string().trim().min(5).max(3000),
  finish: z.string().trim().max(100),
  pricePence: z.number().int().min(1).max(100000000).nullable(),
  stock: z.number().int().min(0).max(100000).nullable(),
  reserved: z.number().int().min(0).default(0),
  images: z
    .array(
      z
        .string()
        .max(2048)
        .refine(
          (v) =>
            /^\/images\/[a-z0-9-]+\.webp$/.test(v) ||
            /^\/api\/media\/[a-zA-Z0-9._-]+$/.test(v),
          "Choose an uploaded image",
        ),
    )
    .min(1)
    .max(12),
  active: z.boolean(),
  featured: z.boolean(),
  version: z.number().int().min(0),
});
export type Product = z.infer<typeof productSchema>;
export type Category = (typeof categories)[number];
export const settingsSchema = z.object({
  heroTitle: z.string().trim().min(5).max(120),
  heroSubtitle: z.string().trim().min(10).max(400),
  heroImage: z
    .string()
    .refine(
      (v) =>
        /^\/images\/[a-z0-9-]+\.webp$/.test(v) ||
        /^\/api\/media\/[a-zA-Z0-9._-]+$/.test(v),
    ),
  phone: z.string().regex(/^[+\d ()-]{7,24}$/),
  mobile: z.string().regex(/^[+\d ()-]{7,24}$/),
  instagram: z
    .string()
    .url()
    .refine((v) => new URL(v).hostname === "www.instagram.com"),
  deliveryNote: z.string().trim().min(5).max(400),
  deliveryFeePence: z.number().int().min(0).max(100000).nullable(),
  paymentsEnabled: z.boolean(),
  version: z.number().int().min(0),
});
export type SiteSettings = z.infer<typeof settingsSchema>;
export interface MediaAsset {
  id: string;
  url: string;
  name: string;
  alt: string;
}
export const quoteSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d ()-]{7,24}$/),
  postcode: z.string().trim().min(5).max(12),
  propertyType: z.enum([
    "Rental property",
    "Serviced accommodation",
    "Social housing",
    "Personal home",
  ]),
  bedrooms: z.coerce.number().int().min(0).max(20),
  message: z.string().trim().min(10).max(3000),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
  requestId: z.string().uuid(),
});
export type QuoteInput = z.infer<typeof quoteSchema>;
export interface Quote extends QuoteInput {
  id: string;
  status: "new" | "contacted" | "quoted" | "closed";
  createdAt: string;
}
export interface OrderLine {
  productId: string;
  title: string;
  quantity: number;
  pricePence: number;
  image: string;
}
export type OrderStatus =
  "pending" | "paid" | "processing" | "dispatched" | "delivered" | "expired";
export interface Order {
  id: string;
  email: string;
  status: OrderStatus;
  totalPence: number;
  items: OrderLine[];
  createdAt: string;
}
export interface Integrations {
  database: boolean;
  stripe: boolean;
  mapbox: boolean;
  media: boolean;
  admin: boolean;
}
export interface Bootstrap {
  siteUrl: string;
  products: Product[];
  settings: SiteSettings;
  mode: "preview" | "live";
  integrations: Integrations;
  error?: string;
}
export interface AdminData extends Bootstrap {
  media: MediaAsset[];
  quotes: Quote[];
  orders: Order[];
}
export interface CartLine {
  productId: string;
  quantity: number;
}
export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(80),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1)
    .max(30),
  email: z.string().email().max(200),
  requestId: z.string().uuid(),
});
export const money = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    pence / 100,
  );
export const available = (p: Product) =>
  p.stock === null ? null : Math.max(0, p.stock - p.reserved);
