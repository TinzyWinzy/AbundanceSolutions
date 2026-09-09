import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  assetId: string;
  name: string;
  quantity: number;
  unitPriceUsd: number | null;
  unitPriceZig: number | null;
  thumbnailUrl: string | null;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  remove: (assetId: string) => void;
  setQuantity: (assetId: string, quantity: number) => void;
  clear: () => void;
  count: () => number;
  totalUsd: () => number;
  totalZig: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.assetId === item.assetId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.assetId === item.assetId
                  ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
                  : i
              )
            };
          }
          return { items: [...state.items, { ...item, quantity: item.quantity ?? 1 }] };
        }),
      remove: (assetId) =>
        set((state) => ({ items: state.items.filter((i) => i.assetId !== assetId) })),
      setQuantity: (assetId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.assetId !== assetId)
              : state.items.map((i) => (i.assetId === assetId ? { ...i, quantity } : i))
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalUsd: () =>
        get().items.reduce((sum, i) => sum + (i.unitPriceUsd ?? 0) * i.quantity, 0),
      totalZig: () =>
        get().items.reduce((sum, i) => sum + (i.unitPriceZig ?? 0) * i.quantity, 0)
    }),
    { name: 'abundance-cart' }
  )
);
