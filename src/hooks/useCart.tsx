import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

export type CartItem = {
  product_id: string;
  name: string;
  price_cents: number;
  currency: string;
  vendor_id: string;
  community_id: string;
  quantity: number;
};

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (product_id: string) => void;
  updateQty: (product_id: string, quantity: number) => void;
  clear: () => void;
  count: number;
  subtotal_cents: number;
  currency: string | null;
  vendor_id: string | null;
  community_id: string | null;
}

const Ctx = createContext<CartState | undefined>(undefined);
const LS_KEY = "cart:v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      if (typeof window === 'undefined') return [];
      const raw = window.localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const add: CartState["add"] = useCallback((item, qty = 1) => {
    setItems((prev) => {
      if (prev.length > 0) {
        const v = prev[0].vendor_id;
        const c = prev[0].currency;
        if (v !== item.vendor_id || c !== item.currency) {
          // Enforce single-vendor & single-currency cart to match current order model
          toast.error("Cannot mix vendors", {
            description: "Please checkout your current cart before adding items from a different vendor.",
          });
          return prev; // ignore add
        }
      }
      const i = prev.findIndex((x) => x.product_id === item.product_id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], quantity: Math.min(999, copy[i].quantity + qty) };
        return copy;
      }
      return [...prev, { ...item, quantity: qty }];
    });
  }, []);

  const remove = useCallback((product_id: string) => {
    setItems((prev) => prev.filter((x) => x.product_id !== product_id));
  }, []);

  const updateQty = useCallback((product_id: string, quantity: number) => {
    setItems((prev) => prev.map((x) => (x.product_id === product_id ? { ...x, quantity: Math.max(1, Math.min(999, quantity || 1)) } : x)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotal_cents = useMemo(() => items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0), [items]);
  const count = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);
  const currency = items[0]?.currency ?? null;
  const vendor_id = items[0]?.vendor_id ?? null;
  const community_id = items[0]?.community_id ?? null;

  const value: CartState = { items, add, remove, updateQty, clear, count, subtotal_cents, currency, vendor_id, community_id };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
