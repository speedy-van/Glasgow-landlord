import Stripe from "stripe";
import { checkoutSchema } from "@/lib/domain";
import { config, database, ApiError } from "@/lib/server-store";
import { sameOrigin, jsonBody, json, handleError, limit } from "@/lib/api";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await limit(req, "checkout", 8);
    const p = checkoutSchema.parse(await jsonBody(req));
    const c = config();
    if (!c.STRIPE_SECRET_KEY || !c.STRIPE_WEBHOOK_SECRET)
      throw new ApiError(
        503,
        "Online payments are not available yet. Please request a quotation.",
      );
    const sql = database();
    let rows;
    try {
      rows =
        await sql`SELECT reserve_order(${crypto.randomUUID()}::uuid,${p.requestId}::uuid,${p.email},${JSON.stringify(p.items)}::jsonb) AS order_data`;
    } catch {
      throw new ApiError(
        409,
        "An item is unavailable, its price has changed, or checkout is not enabled. Refresh your basket and try again.",
      );
    }
    const order = rows[0].order_data as {
      id: string;
      email: string;
      status: string;
      stripe_session_id: string | null;
      checkout_expires_at: string;
      items: Array<{ title: string; quantity: number; pricePence: number }>;
      delivery_pence: number;
    };
    if (order.status === "expired")
      throw new ApiError(
        409,
        "This payment session has ended. Please try again to start a new checkout.",
        "CHECKOUT_ENDED",
      );
    if (order.email !== p.email || order.status !== "pending")
      throw new ApiError(
        409,
        "This checkout has already been processed. Refresh and try again.",
      );
    const stripe = new Stripe(c.STRIPE_SECRET_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
    });
    if (order.stripe_session_id) {
      const session = await stripe.checkout.sessions.retrieve(
        order.stripe_session_id,
      );
      if (session.status === "open" && session.url)
        return json({ url: session.url });
      throw new ApiError(
        409,
        "This payment session has ended. Please try again to start a new checkout.",
        "CHECKOUT_ENDED",
      );
    }
    const origin = new URL(req.url).origin;
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          allowed_payment_method_types: ["card"],
          customer_email: order.email,
          client_reference_id: order.id,
          metadata: { orderId: order.id },
          line_items: [
            ...order.items.map((item) => ({
              quantity: item.quantity,
              price_data: {
                currency: "gbp",
                unit_amount: item.pricePence,
                product_data: { name: item.title },
              },
            })),
            ...(order.delivery_pence > 0
              ? [
                  {
                    quantity: 1,
                    price_data: {
                      currency: "gbp",
                      unit_amount: order.delivery_pence,
                      product_data: { name: "Delivery" },
                    },
                  },
                ]
              : []),
          ],
          shipping_address_collection: { allowed_countries: ["GB"] },
          success_url:
            origin + "/checkout/complete?session_id={CHECKOUT_SESSION_ID}",
          cancel_url: origin + "/cart?cancelled=1",
          expires_at: Math.floor(
            new Date(order.checkout_expires_at).getTime() / 1000,
          ),
        },
        { idempotencyKey: "checkout-" + order.id },
      );
    } catch (e) {
      if (e instanceof Stripe.errors.StripeInvalidRequestError) {
        await sql`SELECT expire_unopened_order(${order.id}::uuid)`;
        throw new ApiError(
          409,
          "Checkout could not be opened. Please retry with a new checkout.",
          "CHECKOUT_ENDED",
        );
      }
      throw e;
    }
    await sql`UPDATE orders SET stripe_session_id=${session.id} WHERE id=${order.id} AND stripe_session_id IS NULL`;
    if (!session.url)
      throw new ApiError(502, "Could not open the payment page. Please retry.");
    return json({ url: session.url });
  } catch (e) {
    return handleError(e);
  }
}
