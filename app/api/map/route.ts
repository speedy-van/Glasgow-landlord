import { z } from "zod";
import { config, ApiError } from "@/lib/server-store";
import { handleError, limit } from "@/lib/api";
export async function GET(req: Request) {
  try {
    const token = config().MAPBOX_ACCESS_TOKEN;
    if (!token) throw new ApiError(503, "Map is not connected.");
    await limit(req, "map", 20);
    const u = new URL(req.url);
    const lng = z.coerce
      .number()
      .min(-8.7)
      .max(2)
      .parse(u.searchParams.get("lng"));
    const lat = z.coerce
      .number()
      .min(49)
      .max(61)
      .parse(u.searchParams.get("lat"));
    const url = new URL(
      "https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+203b30(" +
        lng +
        "," +
        lat +
        ")/" +
        lng +
        "," +
        lat +
        ",11/800x440@2x",
    );
    url.searchParams.set("access_token", token);
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new ApiError(502, "Map is temporarily unavailable.");
    return new Response(r.body, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private,no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
