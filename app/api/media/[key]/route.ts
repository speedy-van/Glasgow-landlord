import { get } from "@vercel/blob";
import { database } from "@/lib/server-store";
import { mediaConfigured } from "@/lib/config";
import { validMediaKey } from "@/lib/media";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  if (!validMediaKey(key) || !mediaConfigured())
    return new Response("Not found", { status: 404 });
  try {
    const sql = database();
    const rows =
      await sql`SELECT id FROM media WHERE url=${"/api/media/" + key} LIMIT 1`;
    if (!rows.length) return new Response("Not found", { status: 404 });
    const object = await get("media/" + key, { access: "private" });
    if (!object || object.statusCode !== 200)
      return new Response("Not found", { status: 404 });
    return new Response(object.stream, {
      headers: {
        "Content-Type": object.blob.contentType,
        "Cache-Control": "public,max-age=31536000,immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new Response("Image temporarily unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
