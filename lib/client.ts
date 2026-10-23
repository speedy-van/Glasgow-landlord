"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { z } from "zod";
import { productSchema, settingsSchema, type Bootstrap } from "./domain";
import {
  cartSnapshot,
  cartServerSnapshot,
  subscribeCart,
  updateCart,
} from "./cart-store";
export { CART_KEY } from "./cart-store";
export const PREVIEW_KEY = "furnishing-preview-v1";
const draftSchema = z.object({
  products: z.array(productSchema),
  settings: settingsSchema,
});
export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}
export async function apiRequest<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
    cache: "no-store",
  });
  let data: unknown;
  try {
    data = await r.json();
  } catch {
    throw new Error("The server could not be reached. Please try again.");
  }
  if (!r.ok) {
    const obj = data && typeof data === "object" ? data : {};
    const message =
      "error" in obj && typeof obj.error === "string"
        ? obj.error
        : "Please try again.";
    const code =
      "code" in obj && typeof obj.code === "string" ? obj.code : undefined;
    throw new RequestError(message, r.status, code);
  }
  return data as T;
}
export function useCatalog(initial: Bootstrap) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);
  const activeRequest = useRef<AbortController | null>(null);
  const requestNumber = useRef(0);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!mounted.current) return;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    const sequence = ++requestNumber.current;
    const abort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    else signal?.addEventListener("abort", abort, { once: true });
    setLoading(true);
    try {
      const next = await apiRequest<Bootstrap>("/api/bootstrap", {
        signal: controller.signal,
      });
      if (
        mounted.current &&
        requestNumber.current === sequence &&
        !controller.signal.aborted
      ) {
        if (next.mode === "preview") {
          try {
            const raw = localStorage.getItem(PREVIEW_KEY);
            if (raw) {
              const parsed = draftSchema.parse(JSON.parse(raw));
              next.products = parsed.products.filter((p) => p.active);
              next.settings = parsed.settings;
            }
          } catch {}
        }
        setData(next);
      }
    } catch (e) {
      if (
        mounted.current &&
        requestNumber.current === sequence &&
        !controller.signal.aborted &&
        !(e instanceof DOMException && e.name === "AbortError")
      )
        setData((x) => ({
          ...x,
          error:
            "We could not refresh the collection. Check your connection and retry.",
        }));
    } finally {
      signal?.removeEventListener("abort", abort);
      if (mounted.current && requestNumber.current === sequence)
        setLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const c = new AbortController();
    void refresh(c.signal);
    const onStorage = (e: StorageEvent) => {
      if (e.key === PREVIEW_KEY) void refresh(c.signal);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh(c.signal);
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void refresh(c.signal);
    }, 30000);
    return () => {
      mounted.current = false;
      c.abort();
      activeRequest.current?.abort();
      clearInterval(id);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);
  return { data, loading, refresh };
}
export function useCart() {
  const { lines, ready } = useSyncExternalStore(
    subscribeCart,
    cartSnapshot,
    cartServerSnapshot,
  );
  const add = useCallback((productId: string, max = 50) => {
    if (!Number.isFinite(max) || max < 1) return;
    const cap = Math.min(Math.floor(max), 50);
    updateCart((old) => {
      const exists = old.find((l) => l.productId === productId);
      return exists
        ? old.map((l) =>
            l.productId === productId
              ? { ...l, quantity: Math.min(cap, l.quantity + 1) }
              : l,
          )
        : old.length < 30
          ? [...old, { productId, quantity: 1 }]
          : old;
    });
  }, []);
  const quantity = useCallback((id: string, q: number) => {
    if (!Number.isInteger(q)) return;
    updateCart((old) =>
      q < 1
        ? old.filter((x) => x.productId !== id)
        : old.map((x) =>
            x.productId === id ? { ...x, quantity: Math.min(q, 50) } : x,
          ),
    );
  }, []);
  return {
    lines,
    ready,
    add,
    quantity,
    count: lines.reduce((n, l) => n + l.quantity, 0),
  };
}
