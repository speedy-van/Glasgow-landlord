import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { productSchema, quoteSchema, available, money } from "../lib/domain.ts";
import { seedProducts, seedSettings } from "../lib/seed.ts";
let db;
before(async () => {
  db = await PGlite.create();
  await db.exec(
    await readFile(new URL("../sql/001-initial.sql", import.meta.url), "utf8"),
  );
  await db.query("INSERT INTO site_settings(id,data) VALUES(1,$1)", [
    JSON.stringify({
      ...seedSettings,
      paymentsEnabled: true,
      deliveryFeePence: 2500,
    }),
  ]);
});
after(async () => {
  await db.close();
});
async function product(id, stock = 2, price = 10000) {
  await db.query(
    "INSERT INTO products(id,slug,title,category,description,finish,price_pence,stock,images,active) VALUES($1,$1,$1,'Living room','Test product','Neutral',$2,$3,'[\"/images/sage-living.webp\"]',true)",
    [id, price, stock],
  );
}
async function reserve(id, requestId = randomUUID(), quantity = 1) {
  const r = await db.query(
    "SELECT reserve_order($1::uuid,$2::uuid,$3,$4::jsonb) AS value",
    [
      randomUUID(),
      requestId,
      "test@example.com",
      JSON.stringify([{ productId: id, quantity }]),
    ],
  );
  return r.rows[0].value;
}
test("unknown stock differs from zero and reservations reduce availability", () => {
  assert.equal(available(seedProducts[0]), null);
  assert.equal(available({ ...seedProducts[0], stock: 0 }), 0);
  assert.equal(available({ ...seedProducts[0], stock: 5, reserved: 2 }), 3);
  assert.equal(money(12345), "£123.45");
});
test("product validation rejects executable media, fractional stock and negative prices", () => {
  const p = seedProducts[0];
  assert.equal(
    productSchema.safeParse({ ...p, images: ["javascript:alert(1)"] }).success,
    false,
  );
  assert.equal(productSchema.safeParse({ ...p, stock: 1.5 }).success, false);
  assert.equal(
    productSchema.safeParse({ ...p, pricePence: -10 }).success,
    false,
  );
  assert.equal(productSchema.safeParse({ ...p, stock: 0 }).success, true);
});
test("enquiries require affirmative consent and an empty honeypot", () => {
  const q = {
    name: "Test User",
    email: "test@example.com",
    phone: "07000000000",
    postcode: "G1 1AA",
    propertyType: "Rental property",
    bedrooms: 2,
    message: "Please quote for this property.",
    requestId: randomUUID(),
    consent: true,
    website: "",
  };
  assert.equal(quoteSchema.safeParse(q).success, true);
  assert.equal(quoteSchema.safeParse({ ...q, consent: false }).success, false);
  assert.equal(quoteSchema.safeParse({ ...q, website: "spam" }).success, false);
});
test("reservations use stored prices and delivery and replay once", async () => {
  await product("one");
  const requestId = randomUUID();
  const a = await reserve("one", requestId);
  const b = await reserve("one", requestId);
  assert.equal(a.id, b.id);
  assert.equal(a.total_pence, 12500);
  assert.equal(a.items[0].pricePence, 10000);
  const r = await db.query("SELECT reserved FROM products WHERE id=$1", [
    "one",
  ]);
  assert.equal(r.rows[0].reserved, 1);
});
test("competing reservations cannot oversell the final unit", async () => {
  await product("last", 1);
  const results = await Promise.allSettled([reserve("last"), reserve("last")]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const r = await db.query("SELECT stock,reserved FROM products WHERE id=$1", [
    "last",
  ]);
  assert.deepEqual(r.rows[0], { stock: 1, reserved: 1 });
});
test("a failed multi-product reservation rolls back all inventory", async () => {
  await product("rollback-a", 3);
  await product("rollback-z", 0);
  await assert.rejects(
    db.query("SELECT reserve_order($1::uuid,$2::uuid,$3,$4::jsonb)", [
      randomUUID(),
      randomUUID(),
      "test@example.com",
      JSON.stringify([
        { productId: "rollback-a", quantity: 1 },
        { productId: "rollback-z", quantity: 1 },
      ]),
    ]),
  );
  const r = await db.query("SELECT reserved FROM products WHERE id=$1", [
    "rollback-a",
  ]);
  assert.equal(r.rows[0].reserved, 0);
});
test("verified payments settle stock once even with duplicate or reordered events", async () => {
  await product("paid", 2);
  const order = await reserve("paid");
  await db.query("UPDATE orders SET stripe_session_id=$1 WHERE id=$2", [
    "cs_test_paid",
    order.id,
  ]);
  const event = randomUUID();
  const args = [event, order.id, "cs_test_paid", "paid", 12500, "gbp"];
  await db.query("SELECT apply_stripe_event($1,$2::uuid,$3,$4,$5,$6)", args);
  await db.query("SELECT apply_stripe_event($1,$2::uuid,$3,$4,$5,$6)", args);
  await db.query("SELECT apply_stripe_event($1,$2::uuid,$3,$4,$5,$6)", [
    randomUUID(),
    order.id,
    "cs_test_paid",
    "expired",
    12500,
    "gbp",
  ]);
  const r = await db.query("SELECT stock,reserved FROM products WHERE id=$1", [
    "paid",
  ]);
  assert.deepEqual(r.rows[0], { stock: 1, reserved: 0 });
});
test("payment amount mismatches leave reservations intact and event retryable", async () => {
  await product("mismatch", 1);
  const order = await reserve("mismatch");
  await db.query("UPDATE orders SET stripe_session_id=$1 WHERE id=$2", [
    "cs_test_mismatch",
    order.id,
  ]);
  const event = randomUUID();
  await assert.rejects(
    db.query("SELECT apply_stripe_event($1,$2::uuid,$3,$4,$5,$6)", [
      event,
      order.id,
      "cs_test_mismatch",
      "paid",
      1,
      "gbp",
    ]),
  );
  const r = await db.query("SELECT stock,reserved FROM products WHERE id=$1", [
    "mismatch",
  ]);
  assert.deepEqual(r.rows[0], { stock: 1, reserved: 1 });
  const events = await db.query("SELECT id FROM stripe_events WHERE id=$1", [
    event,
  ]);
  assert.equal(events.rows.length, 0);
});
test("expired sessions release reserved units without reducing stock", async () => {
  await product("expire", 4);
  const order = await reserve("expire", randomUUID(), 2);
  await db.query("UPDATE orders SET stripe_session_id=$1 WHERE id=$2", [
    "cs_test_expired",
    order.id,
  ]);
  await db.query("SELECT apply_stripe_event($1,$2::uuid,$3,$4,$5,$6)", [
    randomUUID(),
    order.id,
    "cs_test_expired",
    "expired",
    22500,
    "gbp",
  ]);
  const r = await db.query("SELECT stock,reserved FROM products WHERE id=$1", [
    "expire",
  ]);
  assert.deepEqual(r.rows[0], { stock: 4, reserved: 0 });
});
test("unopened sessions may be released once and cannot release an attached session", async () => {
  await product("unopened", 3);
  const order = await reserve("unopened");
  await db.query("SELECT expire_unopened_order($1::uuid)", [order.id]);
  await db.query("SELECT expire_unopened_order($1::uuid)", [order.id]);
  const next = await reserve("unopened");
  await db.query("UPDATE orders SET stripe_session_id=$1 WHERE id=$2", [
    "cs_test_attached",
    next.id,
  ]);
  await db.query("SELECT expire_unopened_order($1::uuid)", [next.id]);
  const r = await db.query("SELECT stock,reserved FROM products WHERE id=$1", [
    "unopened",
  ]);
  assert.deepEqual(r.rows[0], { stock: 3, reserved: 1 });
});
