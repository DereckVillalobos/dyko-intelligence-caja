import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine, Product } from "./types";

type CartState = {
  items: CartLine[];
  addProduct: (product: Product) => void;
  addOpenAmount: (amount: number, label?: string) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addProduct: (product) => {
        const key = `p-${product.id}`;
        const current = get().items.find((item) => item.key === key);
        if (current) {
          set({
            items: get().items.map((item) =>
              item.key === key ? { ...item, qty: item.qty + 1 } : item,
            ),
          });
          return;
        }
        const line: CartLine = {
          key,
          productId: product.id,
          barcode: product.barcode,
          name: product.name,
          unitPrice: product.price,
          qty: 1,
        };
        set({ items: [...get().items, line] });
      },
      addOpenAmount: (amount, label = "Monto abierto") => {
        const key = `open-${Date.now()}`;
        const line: CartLine = {
          key,
          productId: null,
          barcode: key,
          name: label,
          unitPrice: amount,
          qty: 1,
        };
        set({ items: [...get().items, line] });
      },
      setQty: (key, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((item) => item.key !== key) });
          return;
        }
        set({
          items: get().items.map((item) => (item.key === key ? { ...item, qty } : item)),
        });
      },
      remove: (key) => set({ items: get().items.filter((item) => item.key !== key) }),
      clear: () => set({ items: [] }),
    }),
    { name: "dyko-cart" },
  ),
);

export function cartTotals(items: CartLine[]) {
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  return { count, total };
}
