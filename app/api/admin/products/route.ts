import { productSchema } from "@/lib/domain";
import { database, ApiError, mapProduct } from "@/lib/server-store";
import {
  requireAdmin,
  sameOrigin,
  jsonBody,
  json,
  handleError,
  limit,
} from "@/lib/api";
export async function PUT(req: Request) {
  try {
    sameOrigin(req);
    await requireAdmin();
    await limit(req, "product", 60);
    const p = productSchema.parse(await jsonBody(req));
    const sql = database();
    let rows;
    if (p.version === 0) {
      rows =
        await sql`INSERT INTO products(id,slug,title,category,description,finish,price_pence,stock,images,active,featured,version) VALUES(${p.id},${p.slug},${p.title},${p.category},${p.description},${p.finish},${p.pricePence},${p.stock},${JSON.stringify(p.images)}::jsonb,${p.active},${p.featured},1) ON CONFLICT(id) DO NOTHING RETURNING *`;
    } else {
      rows =
        await sql`UPDATE products SET slug=${p.slug},title=${p.title},category=${p.category},description=${p.description},finish=${p.finish},price_pence=${p.pricePence},stock=${p.stock},images=${JSON.stringify(p.images)}::jsonb,active=${p.active},featured=${p.featured},version=version+1,updated_at=now() WHERE id=${p.id} AND version=${p.version} AND (reserved=0 OR ${p.stock}::integer IS NOT NULL) AND (${p.stock}::integer IS NULL OR reserved<=${p.stock}::integer) RETURNING *`;
    }
    if (!rows.length)
      throw new ApiError(
        409,
        "This item changed on another device, or stock is below the reserved quantity. Refresh and try again.",
      );
    return json(mapProduct(rows[0]));
  } catch (e) {
    return handleError(e);
  }
}
