import { getAdminSession } from "./auth";
import {
  administratorEmails,
  authenticationConfigured,
  siteOrigin,
} from "./config";
import { hasTrustedOrigin } from "./request-origin";
import { ApiError, config, database } from "./server-store";
import { ZodError } from "zod";
export async function requireAdmin() {
  if (!authenticationConfigured())
    throw new ApiError(503, "Administration is temporarily unavailable.");
  const session = await getAdminSession();
  if (!session)
    throw new ApiError(
      401,
      "Your session has ended. Sign in again to continue.",
    );
  if (!administratorEmails().includes(session.user.email.toLowerCase()))
    throw new ApiError(403, "This account does not have administrator access.");
  return session.user;
}
export function sameOrigin(req: Request) {
  if (!hasTrustedOrigin(req, siteOrigin()))
    throw new ApiError(403, "Please submit this request from the website.");
}
export async function jsonBody(req: Request) {
  if (!req.headers.get("content-type")?.includes("application/json"))
    throw new ApiError(415, "Send a JSON request.");
  const text = await req.text();
  if (text.length > 60000) throw new ApiError(413, "The request is too large.");
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "The request could not be read.");
  }
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export function handleError(e: unknown) {
  if (e instanceof ApiError)
    return json({ error: e.message, code: e.code }, e.status);
  if (e instanceof ZodError)
    return json(
      { error: e.issues[0]?.message ?? "Check the form fields." },
      400,
    );
  console.error("Request failed", e instanceof Error ? e.name : "UnknownError");
  return json({ error: "This could not be saved. Please try again." }, 500);
}
export async function limit(req: Request, scope: string, max = 15) {
  if (!config().DATABASE_URL) return;
  const ip =
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(scope + ":" + ip),
  );
  const key = Array.from(new Uint8Array(bytes))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
  const sql = database();
  const rows =
    await sql`INSERT INTO rate_limits(key) VALUES(${key}) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.window_start<now()-interval '1 minute' THEN 1 ELSE rate_limits.count+1 END,window_start=CASE WHEN rate_limits.window_start<now()-interval '1 minute' THEN now() ELSE rate_limits.window_start END RETURNING count`;
  if (rows[0].count > max)
    throw new ApiError(429, "Please wait a minute and try again.");
}
