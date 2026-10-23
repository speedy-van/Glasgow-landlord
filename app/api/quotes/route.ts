import { quoteSchema } from "@/lib/domain";
import { database } from "@/lib/server-store";
import { sameOrigin, jsonBody, json, handleError, limit } from "@/lib/api";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await limit(req, "quote", 5);
    const data = quoteSchema.parse(await jsonBody(req));
    const sql = database();
    const id = crypto.randomUUID();
    const rows =
      await sql`INSERT INTO quotes(id,request_id,data) VALUES(${id},${data.requestId},${JSON.stringify(data)}::jsonb) ON CONFLICT(request_id) DO UPDATE SET request_id=excluded.request_id RETURNING id`;
    return json({ id: rows[0].id }, 201);
  } catch (e) {
    return handleError(e);
  }
}
