import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CART_KEY,
  cartSnapshot,
  subscribeCart,
  updateCart,
} from "../lib/cart-store.ts";

test("basket consumers stay synchronized across local edits, tab events and unavailable storage", () => {
  const data = new Map();
  const events = new EventTarget();
  globalThis.window = events;
  let unavailable = false;
  globalThis.localStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      if (unavailable) throw new Error("Storage unavailable");
      data.set(key, value);
    },
  };
  const first = [],
    second = [];
  const unsubscribeFirst = subscribeCart(() =>
    first.push(cartSnapshot().lines),
  );
  const unsubscribeSecond = subscribeCart(() =>
    second.push(cartSnapshot().lines),
  );
  try {
    updateCart(() => [{ productId: "one", quantity: 1 }]);
    assert.deepEqual(first.at(-1), second.at(-1));
    assert.equal(cartSnapshot().lines[0].quantity, 1);
    data.set(CART_KEY, JSON.stringify([{ productId: "one", quantity: 3 }]));
    const event = new Event("storage");
    Object.defineProperty(event, "key", { value: CART_KEY });
    events.dispatchEvent(event);
    assert.equal(first.at(-1)[0].quantity, 3);
    assert.equal(second.at(-1)[0].quantity, 3);
    data.set(CART_KEY, "invalid-json");
    events.dispatchEvent(event);
    assert.deepEqual(cartSnapshot().lines, []);
    unavailable = true;
    updateCart(() => [{ productId: "two", quantity: 2 }]);
    assert.equal(cartSnapshot().lines[0].productId, "two");
    assert.deepEqual(first.at(-1), second.at(-1));
    updateCart(() => []);
    assert.deepEqual(cartSnapshot().lines, []);
    assert.deepEqual(first.at(-1), []);
    assert.deepEqual(second.at(-1), []);
  } finally {
    unsubscribeFirst();
    unsubscribeSecond();
    delete globalThis.window;
    delete globalThis.localStorage;
  }
});
