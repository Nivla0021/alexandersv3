import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ✅ Updated CartItem with variant support
export interface CartItem {
  id: string;                  // Product ID
  name: string;
  price: number;               // Price of the selected variant
  image: string;
  quantity: number;
  variantId?: string;          // Selected variant ID
  variantLabel?: string;       // Selected variant label
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string, variantId?: string) => void;
  updateQuantity: (id: string, quantity: number, variantId?: string) => void;
  updateVariant: (
    id: string,
    variantId: string,
    variantLabel: string,
    price: number
  ) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        const items = get().items;

        // Check for same product + variant
        const existingItem = items.find(
          (i) => i.id === item.id && i.variantId === item.variantId
        );

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.id === item.id && i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity }] });
        }
      },

      removeItem: (id, variantId) => {
        set({
          items: get().items.filter(
            (i) => !(i.id === id && i.variantId === variantId)
          ),
        });
      },

      updateQuantity: (id, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(id, variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id && i.variantId === variantId ? { ...i, quantity } : i
          ),
        });
      },

      // ✅ New: update variant of a cart item
      updateVariant: (id, variantId, variantLabel, price) => {
        set({
          items: get().items.map((i) =>
            i.id === id
              ? { ...i, variantId, variantLabel, price }
              : i
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
