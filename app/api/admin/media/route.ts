import { put, del } from "@vercel/blob";
import { Buffer } from "node:buffer";
import { database, ApiError } from "@/lib/server-store";
import { mediaConfigured } from "@/lib/config";
import { MAX_IMAGE_BYTES, imageType } from "@/lib/media";
import { requireAdmin, sameOrigin, json, handleError, limit } from "@/lib/api";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await requireAdmin();
    await limit(req, "upload", 20);
    if (!mediaConfigured())
      throw new ApiError(503, "Image uploads are temporarily unavailable.");
    if (Number(req.headers.get("content-length") ?? 0) > 4_200_000)
      throw new ApiError(413, "Choose an image smaller than 4 MB.");
    const form = await req.formData();
    const file = form.get("file");
    const alt = String(form.get("alt") ?? "").trim();
    if (
      !(file instanceof File) ||
      file.size > MAX_IMAGE_BYTES ||
      file.size === 0
    )
      throw new ApiError(
        400,
        "Choose a JPEG, PNG or WebP image smaller than 4 MB.",
      );
    if (alt.length < 3 || alt.length > 200)
      throw new ApiError(400, "Add a short description for this image.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = imageType(bytes);
    if (!ext)
      throw new ApiError(400, "Only JPEG, PNG and WebP images are supported.");
    const id = crypto.randomUUID(),
      key = id + "." + ext,
      url = "/api/media/" + key;
    const contentType = ext === "jpg" ? "image/jpeg" : "image/" + ext;
    const blob = await put("media/" + key, Buffer.from(bytes), {
      access: "private",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    try {
      const sql = database();
      await sql`INSERT INTO media(id,url,name,alt) VALUES(${id},${url},${file.name.slice(0, 160)},${alt})`;
    } catch (e) {
      await del(blob.url);
      throw e;
    }
    return json({ id, url, name: file.name, alt }, 201);
  } catch (e) {
    return handleError(e);
  }
}
