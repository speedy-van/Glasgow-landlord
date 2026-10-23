import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";
import { sameOrigin, handleError } from "@/lib/api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    return await toNextJsHandler(getAuth()).GET(request);
  } catch (error) {
    return handleError(error);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    return await toNextJsHandler(getAuth()).POST(request);
  } catch (error) {
    return handleError(error);
  }
}
