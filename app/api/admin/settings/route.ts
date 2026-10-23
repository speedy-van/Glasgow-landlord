import { settingsSchema } from "@/lib/domain";
import { database, ApiError, integrationStatus } from "@/lib/server-store";
import {
  requireAdmin,
  sameOrigin,
  jsonBody,
  json,
  handleError,
} from "@/lib/api";
export async function PUT(req: Request) {
  try {
    sameOrigin(req);
    await requireAdmin();
    const p = settingsSchema.parse(await jsonBody(req));
    if (
      p.paymentsEnabled &&
      (!integrationStatus().stripe || p.deliveryFeePence === null)
    )
      throw new ApiError(
        400,
        "Connect Stripe and set a delivery fee before enabling payments.",
      );
    const sql = database();
    const rows =
      await sql`UPDATE site_settings SET data=${JSON.stringify(p)}::jsonb,version=version+1 WHERE id=1 AND version=${p.version} RETURNING version`;
    if (!rows.length)
      throw new ApiError(
        409,
        "Settings changed on another device. Refresh and try again.",
      );
    return json({ ...p, version: rows[0].version });
  } catch (e) {
    return handleError(e);
  }
}
