import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ✅ Updated CartItem with variant support and additional fields
export interface CartItem {
  id: string;                  // Product ID
  name: string;
  price: number;               // Price of the selected variant
  image: string;
  quantity: number;
  variantId: string;           // Make required instead of optional
  variantLabel: string;        // Make required instead of optional
  productType?: 'in-store' | 'online' | 'both';  // Optional: track product type
  priceType?: 'in-store' | 'online';              // Optional: track which price was used
}

interface CartStore {
  items: CartItem[];
  
  // Core cart operations
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string, variantId: string) => void;  // Make variantId required
  updateQuantity: (id: string, quantity: number, variantId: string) => void;  // Make variantId required
  updateVariant: (
    id: string,
    variantId: string,
    variantLabel: string,
    price: number
  ) => void;
  clearCart: () => void;
  
  // Utility methods
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemCount: () => number;  // Alias for getTotalItems (for compatibility)
  isInCart: (id: string, variantId: string) => boolean;  // Check if item exists
  getItemQuantity: (id: string, variantId: string) => number;  // Get specific item quantity
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        const items = get().items;

        // Ensure variantId and variantLabel are provided
        if (!item.variantId || !item.variantLabel) {
          console.error('Variant ID and label are required');
          return;
        }

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

      // ✅ Update variant of a cart item
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

      // ✅ Alias for getTotalItems (for backward compatibility)
      getItemCount: () => {
        return get().getTotalItems();
      },

      // ✅ Check if an item exists in cart
      isInCart: (id, variantId) => {
        return get().items.some(
          (item) => item.id === id && item.variantId === variantId
        );
      },

      // ✅ Get quantity of specific item
      getItemQuantity: (id, variantId) => {
        const item = get().items.find(
          (item) => item.id === id && item.variantId === variantId
        );
        return item?.quantity || 0;
      },
    }),
    {
      name: 'cart-storage',
      // Optional: Migrate old cart data to new format
      migrate: (persistedState: any, version) => {
        if (version === 0) {
          // Handle migration from older versions if needed
          return {
            ...persistedState,
            items: persistedState.items?.map((item: any) => ({
              ...item,
              // Ensure variant fields exist
              variantId: item.variantId || 'default',
              variantLabel: item.variantLabel || 'Regular',
            })) || [],
          };
        }
        return persistedState;
      },
      version: 1, // Increment version when schema changes
    }
  )
);