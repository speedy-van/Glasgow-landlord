import { config, ApiError } from "@/lib/server-store";
import { json, handleError, limit } from "@/lib/api";
export async function GET(req: Request) {
  try {
    const token = config().MAPBOX_ACCESS_TOKEN;
    if (!token)
      throw new ApiError(
        503,
        "Address search is not connected. Enter your postcode manually.",
      );
    await limit(req, "geocode", 20);
    const q = new URL(req.url).searchParams.get("q")?.trim();
    if (!q || q.length < 3 || q.length > 120)
      throw new ApiError(400, "Enter a UK postcode or address.");
    const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
    url.search = new URLSearchParams({
      q,
      country: "gb",
      proximity: "-4.2518,55.8642",
      limit: "5",
      access_token: token,
    }).toString();
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok)
      throw new ApiError(
        502,
        "Address search is unavailable. Enter your postcode manually.",
      );
    const data = (await res.json()) as {
      features: Array<{
        id: string;
        properties: { full_address?: string; name?: string };
        geometry: { coordinates: [number, number] };
      }>;
    };
    return json({
      results: data.features.map((f) => ({
        id: f.id,
        label: f.properties.full_address ?? f.properties.name ?? "Address",
        coordinates: f.geometry.coordinates,
      })),
    });
  } catch (e) {
    return handleError(e);
  }
}
