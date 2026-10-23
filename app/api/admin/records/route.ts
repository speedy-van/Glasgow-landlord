import { z } from "zod";
import { database, ApiError } from "@/lib/server-store";
import {
  requireAdmin,
  sameOrigin,
  jsonBody,
  json,
  handleError,
} from "@/lib/api";
const schema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("quote"),
    id: z.string().uuid(),
    status: z.enum(["new", "contacted", "quoted", "closed"]),
  }),
  z.object({
    type: z.literal("order"),
    id: z.string().uuid(),
    status: z.enum(["processing", "dispatched", "delivered"]),
  }),
]);
export async function PATCH(req: Request) {
  try {
    sameOrigin(req);
    await requireAdmin();
    const p = schema.parse(await jsonBody(req));
    const sql = database();
    const rows =
      p.type === "quote"
        ? await sql`UPDATE quotes SET status=${p.status} WHERE id=${p.id} RETURNING id`
        : await sql`UPDATE orders SET status=${p.status} WHERE id=${p.id} AND ((status='paid' AND ${p.status}='processing') OR (status='processing' AND ${p.status}='dispatched') OR (status='dispatched' AND ${p.status}='delivered')) RETURNING id`;
    if (!rows.length)
      throw new ApiError(
        409,
        "The record changed or this status transition is unavailable. Refresh and try again.",
      );
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
