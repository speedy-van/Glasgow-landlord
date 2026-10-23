import { z } from "zod";
import type { CartLine } from "./domain";

export const CART_KEY = "furnishing-basket-v1";
const linesSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(80),
      quantity: z.number().int().min(1).max(50),
    }),
  )
  .max(30)
  .refine(
    (lines) =>
      new Set(lines.map((line) => line.productId)).size === lines.length,
  );
type Snapshot = { lines: CartLine[]; ready: boolean };
const serverSnapshot: Snapshot = { lines: [], ready: false };
let snapshot: Snapshot = { lines: [], ready: true };
let serialized: string | null | undefined;
let memoryOnly = false;
const listeners = new Set<() => void>();

export function cartServerSnapshot() {
  return serverSnapshot;
}

export function cartSnapshot() {
  if (typeof window === "undefined") return serverSnapshot;
  if (memoryOnly) return snapshot;
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (raw !== serialized) {
      serialized = raw;
      let lines: CartLine[] = [];
      try {
        lines = linesSchema.parse(JSON.parse(raw ?? "[]"));
      } catch {}
      snapshot = { lines, ready: true };
    }
  } catch {
    memoryOnly = true;
  }
  return snapshot;
}

function storageChanged(event: StorageEvent) {
  if (event.key !== CART_KEY && event.key !== null) return;
  serialized = undefined;
  memoryOnly = false;
  cartSnapshot();
  listeners.forEach((listener) => listener());
}

export function subscribeCart(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", storageChanged);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0)
      window.removeEventListener("storage", storageChanged);
  };
}

export function updateCart(update: (current: CartLine[]) => CartLine[]) {
  const commit = () => {
    const parsed = linesSchema.safeParse(update(cartSnapshot().lines));
    if (!parsed.success) return;
    snapshot = { lines: parsed.data, ready: true };
    serialized = JSON.stringify(snapshot.lines);
    try {
      localStorage.setItem(CART_KEY, serialized);
    } catch {
      memoryOnly = true;
    }
    listeners.forEach((listener) => listener());
  };
  if (typeof navigator !== "undefined" && navigator.locks) {
    void navigator.locks.request(CART_KEY, commit).catch(commit);
  } else commit();
}
