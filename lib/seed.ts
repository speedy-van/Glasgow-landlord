import type { Product, SiteSettings, MediaAsset } from "./domain";
const base = {
  pricePence: null,
  stock: null,
  reserved: 0,
  active: true,
  featured: true,
  version: 0,
};
export const seedProducts: Product[] = [
  {
    ...base,
    id: "sage-corner-sofa",
    slug: "sage-corner-sofa",
    title: "The soft corner",
    category: "Living room",
    description:
      "A beautifully balanced corner sofa in a warm neutral fabric. Shown in one of our furnished spaces. Ask our team about the current specification, dimensions and availability.",
    finish: "Warm neutral · Fabric",
    images: ["/images/sage-living.webp", "/images/soft-living.webp"],
  },
  {
    ...base,
    id: "oak-bedroom-set",
    slug: "oak-bedroom-set",
    title: "The oak collection",
    category: "Bedroom",
    description:
      "Natural oak-effect storage brings warmth and a coordinated look to the bedroom. Ask about individual pieces or a complete bedroom package. Accessories are shown for styling inspiration.",
    finish: "Natural oak effect",
    images: ["/images/oak-bedroom.webp", "/images/calm-bedroom.webp"],
  },
  {
    ...base,
    id: "upholstered-bedroom",
    slug: "upholstered-bedroom",
    title: "A calmer bedroom",
    category: "Bedroom",
    description:
      "An inviting upholstered bed and a soft, considered palette. Plan a bedroom that feels ready to come home to. Mattress, furniture and styling options are confirmed in your quotation.",
    finish: "Oatmeal · Upholstered",
    images: ["/images/calm-bedroom.webp", "/images/oak-bedroom.webp"],
  },
  {
    ...base,
    id: "oak-dining-set",
    slug: "oak-dining-set",
    title: "Room at the table",
    category: "Dining",
    description:
      "A warm wood-effect dining table with upholstered seating and dark legs. A practical focal point for everyday living. Confirm sizes, chair quantities and current options with our team.",
    finish: "Warm oak · Charcoal",
    images: ["/images/oak-dining.webp"],
  },
  {
    ...base,
    id: "soft-living-set",
    slug: "soft-living-set",
    title: "Everyday living",
    category: "Living room",
    description:
      "A relaxed living space with soft seating and a warm wood-effect coffee table. Enquire about a coordinated living room package tailored to your property.",
    finish: "Soft grey · Natural wood",
    images: ["/images/soft-living.webp", "/images/sage-living.webp"],
  },
];
export const seedSettings: SiteSettings = {
  heroTitle: "Beautiful spaces.\nWithout the hard work.",
  heroSubtitle:
    "Furniture, appliances and complete property furnishing. Thoughtfully chosen. Personally taken care of. Right here in Glasgow.",
  heroImage: "/images/sage-living.webp",
  phone: "0141 778 8433",
  mobile: "07757 765427",
  instagram: "https://www.instagram.com/glasgowlandlordsolutions/",
  deliveryNote:
    "Tell us your postcode and property access details. We will confirm delivery, installation and any charges in your quotation.",
  deliveryFeePence: null,
  paymentsEnabled: false,
  version: 0,
};
export const seedMedia: MediaAsset[] = [
  {
    id: "sage-living",
    url: "/images/sage-living.webp",
    name: "Sage living room",
    alt: "Neutral corner sofa in a sage green living room",
  },
  {
    id: "calm-bedroom",
    url: "/images/calm-bedroom.webp",
    name: "Calm bedroom",
    alt: "Warm neutral bedroom with upholstered bed and oak storage",
  },
  {
    id: "oak-bedroom",
    url: "/images/oak-bedroom.webp",
    name: "Oak bedroom storage",
    alt: "Oak-effect wardrobe and matching chest of drawers",
  },
  {
    id: "oak-dining",
    url: "/images/oak-dining.webp",
    name: "Oak dining room",
    alt: "Wood-effect dining table with four upholstered chairs",
  },
  {
    id: "soft-living",
    url: "/images/soft-living.webp",
    name: "Soft living room",
    alt: "Grey corner sofa and wooden coffee table",
  },
  {
    id: "brand-reference",
    url: "/images/brand-reference.webp",
    name: "Original service information",
    alt: "Furniture and appliance service information",
  },
];
