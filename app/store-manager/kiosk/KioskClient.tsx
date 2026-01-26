'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Banknote, Smartphone, Camera, ChevronDown } from 'lucide-react';

// ---------- UPDATED TYPES ----------
type Variant = {
  id: string;
  label: string;
  price: number;
  productId: string;
};

type Product = {
  id: string;
  name: string;
  image: string;
  available: boolean;
  category?: string | null;
  variants: Variant[];
};

// UPDATED: Added orderItemId for unique identification
type OrderItem = {
  orderItemId: string; // Unique ID: productId + variantId
  id: string; // Product ID
  name: string;
  price: number;
  quantity: number;
  variantId: string;
  variantLabel: string;
  productId: string;
};

export default function KioskClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({}); // productId -> variantId
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [undoItems, setUndoItems] = useState<OrderItem[] | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCashierInfoModal, setShowCashierInfoModal] = useState(false);
  const [showOrderReviewModal, setShowOrderReviewModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [stage, setStage] = useState<'start' | 'mode' | 'order'>('start');
  const [orderMode, setOrderMode] = useState<'DINE-IN' | 'TAKEOUT' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASHIER' | 'GCASH' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------- Initialize selected variants ----------
  useEffect(() => {
    const initialVariants: Record<string, string> = {};
    products.forEach(product => {
      if (product.variants && product.variants.length > 0) {
        initialVariants[product.id] = product.variants[0].id;
      }
    });
    setSelectedVariants(initialVariants);
  }, [products]);

  // ---------- Detect fullscreen ----------
  useEffect(() => {
    const handleChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const categories = Array.from(
    new Set(products.map((p) => p.category || 'Uncategorized'))
  );

  // ---------- FILTER ----------
  const filtered = products.filter((p) => {
    const matchQuery =
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.category?.toLowerCase().includes(query.toLowerCase()) ?? false);

    const matchCategory =
        activeCategory === 'ALL' ||
        (p.category ?? 'Uncategorized') === activeCategory;

    return matchQuery && matchCategory;
  });

  // ---------- VARIANT HELPER FUNCTIONS ----------
  const getSelectedVariant = (productId: string): Variant | null => {
    const variantId = selectedVariants[productId];
    const product = products.find(p => p.id === productId);
    if (!product || !product.variants) return null;
    return product.variants.find(v => v.id === variantId) || product.variants[0] || null;
  };

  const getSelectedVariantPrice = (productId: string): number => {
    const variant = getSelectedVariant(productId);
    return variant?.price || 0;
  };

  // ---------- UPDATED ORDER LOGIC ----------
  const addToOrder = (product: Product) => {
    const qty = quantities[product.id] ?? 1;
    const variantId = selectedVariants[product.id];
    const variant = product.variants.find(v => v.id === variantId);
    
    if (!variant) {
      setToast('Please select a variant');
      return;
    }

    // Create unique order item ID
    const orderItemId = `${product.id}-${variantId}`;
    
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.orderItemId === orderItemId);
      if (existing) {
        return prev.map((i) =>
          i.orderItemId === orderItemId 
            ? { ...i, quantity: i.quantity + qty } 
            : i
        );
      }
      return [...prev, { 
        orderItemId, // Unique identifier
        id: product.id, 
        name: product.name, 
        price: variant.price, 
        quantity: qty,
        variantId: variant.id,
        variantLabel: variant.label,
        productId: product.id
      }];
    });
    setQuantities((q) => ({ ...q, [product.id]: 1 }));
    
    // Show toast notification for adding item
    setToast(`Added ${qty} ${qty === 1 ? 'item' : 'items'} of ${product.name} - ${variant.label} to cart`);
  };

  // UPDATED: Use orderItemId instead of product id
  const updateOrderQty = (orderItemId: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((i) => (i.orderItemId === orderItemId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  // UPDATED: Use orderItemId instead of product id
  const removeItem = (orderItemId: string) => setOrderItems((prev) => prev.filter((i) => i.orderItemId !== orderItemId));

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
  
  // Calculate total quantity of items in cart
  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  // ---------- CHECKOUT ----------
  const handleCheckout = async () => {
    if (!orderItems.length) {
      setToast('No items in the order.');
      return;
    }
    // Step 4: Show payment method selection
    setShowPaymentModal(true);
  };

  // Step 5: Handle CASHIER selection
  const handleCashierPayment = () => {
    setPaymentMethod('CASHIER');
    setShowPaymentModal(false);
    setShowCashierInfoModal(true);
  };

  // Step 6: After info message, show order review
  const handleCashierInfoNext = () => {
    setShowCashierInfoModal(false);
    setShowOrderReviewModal(true);
  };

  // Step 7: Confirm order and show order number
  const confirmCheckout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderSource: 'KIOSK', 
          orderMode: orderMode, 
          items: orderItems.map(item => ({
            id: item.productId,
            variantId: item.variantId,
            variantLabel: item.variantLabel,
            quantity: item.quantity,
            price: item.price
          })),
          paymentMethod: paymentMethod === 'CASHIER' ? 'CASH' : 'GCASH'
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setToast(data.error || 'Failed to create order');
        setShowOrderReviewModal(false);
        setIsSubmitting(false);
        return;
      }
      console.log('Order created:', data);
      setOrderNumber(data.order.orderNumber);
      setShowOrderReviewModal(false);
      setShowPrintModal(true);
    } catch {
      setToast('Failed to create order');
      setShowOrderReviewModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset all checkout states
  const resetCheckoutFlow = () => {
    setShowPaymentModal(false);
    setShowCashierInfoModal(false);
    setShowOrderReviewModal(false);
    setShowPrintModal(false);
    setPaymentMethod(null);
    setOrderOpen(false);
    setOrderItems([]);
    setQuantities({});
    setOrderNumber(null);
    setStage('start');
    setOrderMode(null);
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  return (

    <div className="h-screen bg-gray-100 flex flex-col">
      {/* TOP BAR - hidden in fullscreen */}
      {!isFullscreen && (
        <div className="h-16 bg-amber-700 text-white flex items-center gap-4 px-4 text-lg font-semibold">
          <button
            onClick={() => router.push('/store-manager/dashboard')}
            className="bg-amber-600 px-3 py-1 rounded-lg font-semibold hover:bg-amber-500"
          >
            ←
          </button>

          {/* FULLSCREEN */}
          <button
            onClick={() =>
              !document.fullscreenElement
                ? document.documentElement.requestFullscreen()
                : document.exitFullscreen()
            }
            className="bg-amber-600 px-3 py-1 rounded-lg font-semibold hover:bg-amber-500"
          >
            ⛶
          </button>
        </div>
      )}
      {/* STEP 1 - Start Ordering */}
    {stage === 'start' && (
      <div className="h-screen w-screen bg-amber-700 flex flex-col items-center justify-center">
        <button
          onClick={() => setStage('mode')}
          className="bg-white text-amber-700 font-extrabold text-4xl px-12 py-8 rounded-3xl shadow-xl hover:scale-105 transition-all"
        >
          Start Ordering
        </button>
      </div>
    )}
    {/* STEP 2 - Choose dining mode */}
    {stage === 'mode' && (
      <div className="h-screen w-screen bg-amber-700 flex flex-col items-center justify-center gap-10 text-white">
        <h2 className="text-4xl font-bold">Order Type</h2>

        <div className="flex gap-10">
          <button
            onClick={() => {
              setOrderMode('DINE-IN');
              setStage('order');
            }}
            className="bg-white text-amber-700 font-bold text-3xl px-10 py-8 rounded-3xl shadow-lg hover:scale-105 transition-all"
          >
            🍽 Dine-In
          </button>

          <button
            onClick={() => {
              setOrderMode('TAKEOUT');
              setStage('order');
            }}
            className="bg-white text-amber-700 font-bold text-3xl px-10 py-8 rounded-3xl shadow-lg hover:scale-105 transition-all"
          >
            🥡 Take-out
          </button>
        </div>
      </div>
    )}
    {stage === 'order' && (
      <div className="h-screen bg-gray-100 flex flex-col">
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
          {/* Category Breadcrumbs */}
            <div className="flex flex-wrap gap-2 mb-4">
            <button
                onClick={() => setActiveCategory('ALL')}
                className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                activeCategory === 'ALL'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100'
                }`}
            >
                All Products
            </button>

            {categories.map((cat) => (
                <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                    activeCategory === cat
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100'
                }`}
                >
                {cat}
                </button>
            ))}
            </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product) => {
              const qty = quantities[product.id] ?? 1;
              const selectedVariant = getSelectedVariant(product.id);
              const currentPrice = selectedVariant?.price || 0;
              
              return (
                <div key={product.id} className="bg-white rounded-xl shadow p-3 flex flex-col">
                  <div className="w-full aspect-[4/3] bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                  </div>

                  <div className="font-semibold mb-1">{product.name}</div>
                  
                  {/* Variant Selector */}
                  {product.variants && product.variants.length > 1 && (
                    <div className="mb-2">
                      <div className="relative">
                        <select
                          value={selectedVariants[product.id] || ''}
                          onChange={(e) => setSelectedVariants(prev => ({
                            ...prev,
                            [product.id]: e.target.value
                          }))}
                          className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white appearance-none pr-8"
                        >
                          {product.variants.map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.label} - ₱{variant.price.toFixed(2)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  )}
                  
                  {/* Display price based on selected variant */}
                  <div className="text-amber-700 font-bold mb-2">
                    ₱{currentPrice.toFixed(2)}
                    {product.variants && product.variants.length === 1 && (
                      <span className="text-xs text-gray-500 ml-2">({product.variants[0].label})</span>
                    )}
                  </div>

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
                    className="mt-auto py-2 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!product.variants || product.variants.length === 0}
                  >
                    {!product.variants || product.variants.length === 0 ? 'No variants' : 'Add to Order'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* DESKTOP ORDER PANEL */}
        <div className="hidden lg:flex w-[420px] bg-white border-l flex-col">
          <OrderPanel
            items={orderItems}
            updateQty={updateOrderQty}
            removeItem={removeItem}
            total={total}
            totalQuantity={totalQuantity}
            onClear={() => setShowConfirmClear(true)}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* FLOAT CART BUTTON MOBILE */}
      <button
        onClick={() => setOrderOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 p-4 rounded-full bg-amber-600 shadow-lg text-white z-40 flex items-center justify-center"
      >
        <ShoppingCart className="w-6 h-6" />
        {totalQuantity > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {totalQuantity > 99 ? '99+' : totalQuantity}
          </div>
        )}
      </button>

      {/* DESKTOP CART INDICATOR */}
      <div className="hidden lg:flex fixed bottom-6 right-6 p-4 rounded-full bg-amber-600 shadow-lg text-white z-40 flex items-center justify-center">
        <ShoppingCart className="w-6 h-6" />
        {totalQuantity > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {totalQuantity > 99 ? '99+' : totalQuantity}
          </div>
        )}
      </div>

      {/* MOBILE SLIDE PANEL */}
      {orderOpen && (
      <div className="lg:hidden fixed inset-0 bg-black/50 z-50">
          <div className="absolute right-0 top-0 h-full w-[360px] bg-white flex flex-col border-l border-amber-700">
          
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-amber-700 flex justify-between items-center bg-amber-700 text-white">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Your Order</h2>
                {totalQuantity > 0 && (
                  <div className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalQuantity}
                  </div>
                )}
              </div>
              <button
              onClick={() => setOrderOpen(false)}
              className="bg-amber-600 hover:bg-amber-500 px-3 py-1 rounded-lg font-semibold"
              >
              Close
              </button>
          </div>
          
          {/* Scrollable order items */}
          <div className="flex-grow overflow-y-auto p-4">
              {orderItems.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                  <p>Your order is empty</p>
              </div>
              ) : (
              <div className="space-y-4">
                  {orderItems.map((item) => (
                  <div key={item.orderItemId} className="border-b pb-4 border-amber-200">
                      <div className="flex justify-between">
                      <div>
                          <h3 className="font-medium text-amber-900">{item.name}</h3>
                          <p className="text-sm text-gray-600 mb-1">{item.variantLabel}</p>
                          <p className="text-amber-700">₱{item.price.toFixed(2)}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                          <button
                          onClick={() => updateOrderQty(item.orderItemId, item.quantity - 1)} 
                          className="w-6 h-6 flex items-center justify-center bg-amber-200 hover:bg-amber-300 rounded font-bold text-amber-900"
                          >
                          -
                          </button>
                          <span className="text-amber-900">{item.quantity}</span>
                          <button
                          onClick={() => updateOrderQty(item.orderItemId, item.quantity + 1)} 
                          className="w-6 h-6 flex items-center justify-center bg-amber-200 hover:bg-amber-300 rounded font-bold text-amber-900"
                          >
                          +
                          </button>
                          <button
                          onClick={() => removeItem(item.orderItemId)}
                          className="text-red-600 font-medium hover:text-red-700 ml-2"
                          >
                          Remove
                          </button>
                      </div>
                      </div>
                  </div>
                  ))}
              </div>
              )}
          </div>

          {/* Bottom actions */}
          <div className="flex-shrink-0 border-t border-amber-700 p-4 bg-amber-50">
              <div className="space-y-3">
              <div className="flex justify-between text-lg font-semibold text-amber-900">
                  <span>Total ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}):</span>
                  <span>₱{total.toFixed(2)}</span>
              </div>

              <div className="flex space-x-2">
                  <button
                  onClick={() => setShowConfirmClear(true)}
                  className="flex-1 bg-amber-200 hover:bg-amber-300 text-amber-900 py-3 rounded-lg font-semibold"
                  >
                  Clear All
                  </button>

                  <button
                  onClick={handleCheckout}
                  disabled={orderItems.length === 0}
                  className={`flex-1 py-3 rounded-lg font-semibold ${
                      orderItems.length === 0
                      ? "bg-amber-200 text-amber-400 cursor-not-allowed"
                      : "bg-amber-600 hover:bg-amber-500 text-white"
                  }`}
                  >
                  Checkout
                  </button>
              </div>
              </div>
          </div>

          </div>
      </div>
      )}


      {/* STEP 4: PAYMENT METHOD SELECTION MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-8 flex flex-col items-center">
            <h2 className="text-3xl font-bold text-amber-700 mb-2">How would you like to pay?</h2>
            <p className="text-gray-600 mb-8">Select your preferred payment method</p>
            
            <div className="flex gap-6 w-full mb-6">
              {/* CASHIER (Cash) Option */}
              <button
                onClick={handleCashierPayment}
                className="flex-1 flex flex-col items-center gap-4 p-8 bg-green-50 border-2 border-green-200 rounded-2xl hover:bg-green-100 hover:border-green-400 transition-all"
              >
                <Banknote className="w-16 h-16 text-green-600" />
                <span className="text-2xl font-bold text-green-700">CASHIER</span>
                <span className="text-gray-600">(Pay with Cash)</span>
              </button>

              {/* GCash Option - Coming Soon */}
              <button
                disabled
                className="flex-1 flex flex-col items-center gap-4 p-8 bg-gray-100 border-2 border-gray-200 rounded-2xl opacity-50 cursor-not-allowed"
              >
                <Smartphone className="w-16 h-16 text-blue-400" />
                <span className="text-2xl font-bold text-gray-500">GCash</span>
                <span className="text-gray-400">(Coming Soon)</span>
              </button>
            </div>

            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-colors"
            >
              Back to Order
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: CASHIER INFO MODAL */}
      {showCashierInfoModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
              <Camera className="w-10 h-10 text-amber-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-amber-700 mb-4">Important Information</h2>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                After a successful order, your <strong className="text-amber-700">order number</strong> will be displayed. 
                <br /><br />
                <strong className="text-amber-700">Take a photo of it</strong> and present it to the cashier to pay.
              </p>
            </div>

            <div className="flex gap-4 w-full">
              <button
                onClick={() => {
                  setShowCashierInfoModal(false);
                  setShowPaymentModal(true);
                }}
                className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCashierInfoNext}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: ORDER REVIEW MODAL */}
      {showOrderReviewModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-amber-700 bg-amber-700 text-white">
              <h2 className="text-2xl font-bold">Review Your Order</h2>
              <p className="text-amber-100 mt-1">Please check your items before confirming</p>
            </div>

            {/* Order Items */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.orderItemId} className="flex justify-between items-center py-3 border-b border-amber-100">
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-900">{item.name}</h3>
                      <p className="text-sm text-gray-600 mb-1">{item.variantLabel}</p>
                      <p className="text-sm text-gray-600">₱{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="font-bold text-amber-700">Qty</div>
                        <div className="text-lg font-semibold">{item.quantity}</div>
                      </div>
                      <div className="text-center min-w-24">
                        <div className="font-bold text-amber-700">Subtotal</div>
                        <div className="text-lg font-semibold">₱{(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t border-amber-700">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Type:</span>
                    <span className="font-semibold">{orderMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-semibold text-green-600">Pay at Cashier (Cash)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Items:</span>
                    <span className="font-semibold">{totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}</span>
                  </div>
                  <div className="flex justify-between text-xl mt-4 pt-4 border-t">
                    <span className="font-bold text-amber-900">Total Amount:</span>
                    <span className="font-bold text-amber-700">₱{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-amber-700 bg-amber-50">
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowOrderReviewModal(false);
                    setShowCashierInfoModal(true);
                  }}
                  className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={confirmCheckout}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    {/* STEP 7: ORDER NUMBER DISPLAY MODAL */}
    {showPrintModal && (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-md p-8 flex flex-col items-center text-center">

        {/* Print Area */}
        <div className="print-area w-full flex flex-col items-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Camera className="w-10 h-10 text-green-600" />
            </div>
            
            <h2 className="text-3xl font-bold text-green-600 mb-2">Order Successful!</h2>
            
            <p className="text-gray-600 mb-4">Your order number is:</p>

            <div className="bg-amber-100 border-4 border-amber-500 rounded-2xl px-8 py-6 mb-4">
              <div className="text-5xl font-extrabold text-amber-900 tracking-widest">
                {orderNumber}
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-lg font-bold text-red-600 flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                Please take a photo!
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Present this to the cashier to pay
              </p>
            </div>
        </div>

        <div className="flex gap-4 w-full">
            <button
              onClick={() => {
                window.print();
                resetCheckoutFlow();
              }}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
            >
              Print
            </button>

            <button
              onClick={resetCheckoutFlow}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold"
            >
              Done
            </button>
        </div>

        </div>
    </div>
    )}


      {/* CONFIRM CLEAR */}
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

      {/* SUCCESS / ERROR / ADD TO CART TOAST */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-xl z-50">
          {toast}
        </div>
      )}
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
  totalQuantity,
  onClear,
  onCheckout,
}: {
  items: OrderItem[];
  updateQty: (orderItemId: string, delta: number) => void; // Updated type
  removeItem: (orderItemId: string) => void; // Updated type
  total: number;
  totalQuantity: number;
  onClear: () => void;
  onCheckout: () => void;
}) {
  return (
    <>
      {/* Header with quantity indicator */}
      <div className="p-4 border-b border-amber-700 bg-amber-700 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Your Order</h2>
            {totalQuantity > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalQuantity}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {items.length === 0 && <p className="text-gray-500 text-center mt-10">No items added yet</p>}

        {items.map((item) => (
          <div key={item.orderItemId} className="flex justify-between items-center">
            <div>
              <div className="font-semibold">{item.name}</div>
              <div className="text-xs text-gray-600 mb-1">{item.variantLabel}</div>
              <div className="text-sm text-gray-500">
                ₱{item.price.toFixed(2)} × {item.quantity}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(item.orderItemId, -1)} 
                className="w-10 h-10 rounded-lg bg-gray-200 text-lg font-bold"
              >
                −
              </button>
              <span className="w-6 text-center font-semibold">{item.quantity}</span>
              <button
                onClick={() => updateQty(item.orderItemId, 1)}
                className="w-10 h-10 rounded-lg bg-gray-200 text-lg font-bold"
              >
                +
              </button>
              <button
                onClick={() => removeItem(item.orderItemId)} 
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
          <span>Total ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})</span>
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