import { getBootstrap } from "@/lib/server-store";
import { Storefront } from "@/components/storefront";
export const dynamic = "force-dynamic";
export default async function Home() {
  const data = await getBootstrap();
  return <Storefront initial={data} />;
}
