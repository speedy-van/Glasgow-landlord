import Stripe from "stripe";
import { config } from "@/lib/server-store";
import { CheckoutStatus } from "@/components/checkout-status";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Payment status",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  let paid = false,
    reference: string | undefined;
  const key = config().STRIPE_SECRET_KEY;
  if (key && session_id && /^cs_[a-zA-Z0-9_]+$/.test(session_id)) {
    try {
      const stripe = new Stripe(key, {
        httpClient: Stripe.createFetchHttpClient(),
      });
      const s = await stripe.checkout.sessions.retrieve(session_id);
      paid = s.payment_status === "paid";
      reference = s.metadata?.orderId?.slice(0, 8).toUpperCase();
    } catch {}
  }
  return <CheckoutStatus paid={paid} reference={reference} />;
}
