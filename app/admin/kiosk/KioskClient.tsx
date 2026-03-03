'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // <-- import router

// ---------- TYPES ----------
type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  available: boolean;
  category?: string | null;
};

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export default function KioskClient({
  products,
}: {
  products: Product[];
}) {
  const router = useRouter(); // <-- initialize router
  const [query, setQuery] = useState('');
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [undoItems, setUndoItems] = useState<OrderItem[] | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ---------- FILTER ----------
  const filtered = products.filter((p) => {
    const name = p.name.toLowerCase();
    const category = p.category?.toLowerCase() ?? "";

    return (
      name.startsWith(query) ||
      category.startsWith(query)
    );
  });

  // ---------- ORDER LOGIC ----------
  const addToOrder = (product: Product) => {
    const qty = quantities[product.id] ?? 1;
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [
        ...prev,
        { id: product.id, name: product.name, price: product.price, quantity: qty },
      ];
    });
    setQuantities((q) => ({ ...q, [product.id]: 1 }));
  };

  const updateOrderQty = (id: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setOrderItems((prev) => prev.filter((i) => i.id !== id));
  };

  const confirmClearOrder = () => {
    setUndoItems(orderItems);
    setOrderItems([]);
    setQuantities({});
    setShowConfirmClear(false);
    setShowUndo(true);
  };

  const undoClear = () => {
    if (undoItems) {
      setOrderItems(undoItems);
      setUndoItems(null);
      setShowUndo(false);
    }
  };

  useEffect(() => {
    if (!showUndo) return;
    const t = setTimeout(() => {
      setShowUndo(false);
      setUndoItems(null);
    }, 5000);
    return () => clearTimeout(t);
  }, [showUndo]);

  const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ---------- CHECKOUT ----------
  const handleCheckout = async () => {
    if (!orderItems.length) {
      setToast('No items in the order.');
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderSource: 'KIOSK',
          items: orderItems,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast(data.error || 'Failed to create order');
        return;
      }

      setToast('Order successfully created!');
      setOrderItems([]);
      setQuantities({});
    } catch (err) {
      console.error(err);
      setToast('Failed to create order');
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* TOP BAR */}
      <div className="h-16 bg-amber-700 text-white flex items-center justify-between px-4 text-lg font-semibold">
        <div className="flex items-center gap-4">
          {/* BACK BUTTON */}
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-amber-600 px-3 py-1 rounded-lg font-semibold hover:bg-amber-500"
          >
            ←
          </button>
          <span>In-Store Kiosk • Cashier Mode</span>
        </div>

        <button onClick={() => setOrderOpen(true)} className="lg:hidden p-2 rounded-md bg-amber-600">
          ☰
        </button>
      </div>

      {/* MAIN */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* PRODUCTS */}
        <div className="flex-1 p-4 overflow-y-auto">
          <input
            type="text"
            placeholder="Search product name or category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-lg border"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product) => {
              const qty = quantities[product.id] ?? 1;
              return (
                <div key={product.id} className="bg-white rounded-xl shadow p-3 flex flex-col">
                  <div className="w-full aspect-[4/3] bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="font-semibold">{product.name}</div>
                  <div className="text-amber-700 font-bold mb-2">₱{product.price.toFixed(2)}</div>

                  <div className="flex justify-between mb-2">
                    <button
                      onClick={() => setQuantities((q) => ({ ...q, [product.id]: Math.max(1, qty - 1) }))}
                      className="px-3 py-1 bg-gray-200 rounded"
                    >
                      −
                    </button>
                    <span>{qty}</span>
                    <button
                      onClick={() => setQuantities((q) => ({ ...q, [product.id]: qty + 1 }))}
                      className="px-3 py-1 bg-gray-200 rounded"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => addToOrder(product)}
                    className="mt-auto py-2 rounded-lg bg-amber-600 text-white font-semibold"
                  >
                    Add to Order
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ORDER PANEL */}
        <div className="hidden lg:flex w-[420px] bg-white border-l flex-col">
          <OrderPanel
            items={orderItems}
            updateQty={updateOrderQty}
            removeItem={removeItem}
            total={total}
            onClear={() => setShowConfirmClear(true)}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* CONFIRM CLEAR MODAL */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-[320px]">
            <p className="text-lg font-semibold mb-4">Clear current order?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmClear(false)} className="flex-1 py-2 bg-gray-200 rounded">
                Cancel
              </button>
              <button onClick={confirmClearOrder} className="flex-1 py-2 bg-red-600 text-white rounded">
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNDO TOAST */}
      {showUndo && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-xl flex items-center gap-4 z-50">
          <span>Order cleared</span>
          <button onClick={undoClear} className="underline font-semibold">
            Undo
          </button>
        </div>
      )}

      {/* SUCCESS / ERROR TOAST */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-xl z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ---------- ORDER PANEL ---------- */
function OrderPanel({
  items,
  updateQty,
  removeItem,
  total,
  onClear,
  onCheckout,
}: {
  items: OrderItem[];
  updateQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  total: number;
  onClear: () => void;
  onCheckout: () => void;
}) {
  return (
    <>
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {items.length === 0 && <p className="text-gray-500 text-center mt-10">No items added yet</p>}

        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center">
            <div>
              <div className="font-semibold">{item.name}</div>
              <div className="text-sm text-gray-500">
                ₱{item.price.toFixed(2)} × {item.quantity}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(item.id, -1)}
                className="w-10 h-10 rounded-lg bg-gray-200 text-lg font-bold"
              >
                −
              </button>
              <span className="w-6 text-center font-semibold">{item.quantity}</span>
              <button
                onClick={() => updateQty(item.id, 1)}
                className="w-10 h-10 rounded-lg bg-gray-200 text-lg font-bold"
              >
                +
              </button>
              <button
                onClick={() => removeItem(item.id)}
                className="w-10 h-10 rounded-lg bg-red-100 text-red-600 text-xl font-bold hover:bg-red-200"
                title="Remove item"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t space-y-3">
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>₱{total.toFixed(2)}</span>
        </div>

        <button
          onClick={onCheckout}
          className="w-full py-3 bg-green-600 text-white rounded-xl"
        >
          Checkout
        </button>

        <button onClick={onClear} className="w-full py-3 bg-gray-200 rounded-xl">
          Clear Order
        </button>
      </div>
    </>
  );
}
