import Stripe from "stripe";
import { config, database } from "@/lib/server-store";
import { json, handleError } from "@/lib/api";
export async function POST(req: Request) {
  const c = config();
  if (!c.STRIPE_SECRET_KEY || !c.STRIPE_WEBHOOK_SECRET)
    return json({ error: "Payments are not configured." }, 503);
  const signature = req.headers.get("stripe-signature");
  if (!signature) return json({ error: "Missing signature." }, 400);
  const stripe = new Stripe(c.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
  });
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await req.text(),
      signature,
      c.STRIPE_WEBHOOK_SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return json({ error: "Invalid signature." }, 400);
  }
  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.expired"
    ) {
      const s = event.data.object as Stripe.Checkout.Session;
      const id = s.metadata?.orderId;
      if (
        id &&
        (event.type === "checkout.session.expired" ||
          s.payment_status === "paid")
      ) {
        const sql = database();
        await sql`SELECT apply_stripe_event(${event.id},${id}::uuid,${s.id},${event.type === "checkout.session.completed" ? "paid" : "expired"},${s.amount_total},${s.currency})`;
      }
    }
    return json({ received: true });
  } catch (e) {
    return handleError(e);
  }
}
