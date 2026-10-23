import { getAdminData } from "@/lib/server-store";
import { requireAdmin, json, handleError } from "@/lib/api";
export async function GET() {
  try {
    await requireAdmin();
    return json(await getAdminData());
  } catch (e) {
    return handleError(e);
  }
}
