import { getBootstrap } from "@/lib/server-store";
import { json } from "@/lib/api";
export async function GET() {
  return json(await getBootstrap());
}
