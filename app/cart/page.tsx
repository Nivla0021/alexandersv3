'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useCartStore } from '@/lib/cart-store';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, Store, Globe, AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

type Variant = {
  id: string;
  label: string;
  price: number;
  inStorePrice: number | null;
  onlinePrice: number | null;
};

type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string | null;
  available: boolean;
  productType: 'in-store' | 'online' | 'both';
  variants: Variant[];
};

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const updateVariant = useCartStore((state) => state.updateVariant);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const getItemCount = useCartStore((state) => state.getItemCount);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchProducts = useCallback(async () => {
    if (items.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get unique product IDs from cart
      const productIds = [...new Set(items.map(item => item.id))];
      
      // Fetch products by IDs
      const res = await fetch('/api/products/online', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productIds }),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch products: ${res.status}`);
      }

      const productsData: Product[] = await res.json();

      // Create a map for easy lookup
      const productMap: Record<string, Product> = {};
      productsData.forEach((p) => {
        productMap[p.id] = p;
      });

      setProducts(productMap);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setError('Unable to load some products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [items]);

  useEffect(() => {
    if (mounted) {
      fetchProducts();
    }
  }, [mounted, fetchProducts, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // ✅ FIXED: Check if any items are unavailable
  const unavailableItems = items.filter(item => {
    const product = products[item.id];
    if (!product) return true; // Product not found in fetched data
    
    // Check if product is available online
    const isOnlineAvailable = product.productType === 'online' || product.productType === 'both';
    const variant = product.variants.find(v => v.id === item.variantId);
    
    // Check if variant exists and has a valid online price
    const hasOnlinePrice = variant?.onlinePrice !== null && 
                           variant?.onlinePrice !== undefined && 
                           variant?.onlinePrice > 0;
    
    return !product.available || !isOnlineAvailable || !hasOnlinePrice;
  });

  const hasUnavailableItems = unavailableItems.length > 0;

  // Calculate if all items are valid for checkout
  const validItemsCount = items.length - unavailableItems.length;

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalPrice = getTotalPrice();
  const itemCount = getItemCount();
  const deliveryFee = totalPrice >= 500 ? 0 : 50;
  const grandTotal = totalPrice + deliveryFee;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto max-w-5xl px-4 py-12">

          <h1 className="text-4xl font-bold text-amber-900 mb-8">
            Your <span className="text-amber-600">Cart</span>
          </h1>

          {loading ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-md">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your cart...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-md">
              <ShoppingBag className="w-20 h-20 mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Your cart is empty
              </h2>
              <Link
                href="/menu"
                className="inline-block px-8 py-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                Browse Menu
              </Link>
            </div>
          ) : (
            <>
              {/* Error Message with Retry */}
              {error && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm text-yellow-700">{error}</p>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              )}

              {/* Unavailable Items Warning */}
              {hasUnavailableItems && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-700 mb-1">
                      {unavailableItems.length} {unavailableItems.length === 1 ? 'item is' : 'items are'} no longer available
                    </h3>
                    <p className="text-sm text-red-600">
                      Please remove unavailable items before proceeding to checkout.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Items */}
                <div className="lg:col-span-2 space-y-4">
                  {items.map((item) => {
                    const product = products[item.id];
                    const isLoading = loading && !product;
                    const isAvailable = product?.available ?? true;
                    const isOnlineAvailable = product?.productType === 'online' || product?.productType === 'both';
                    const variant = product?.variants.find(v => v.id === item.variantId);
                    
                    // ✅ FIXED: Check if variant has valid online price
                    const hasOnlinePrice = variant?.onlinePrice !== null && 
                                           variant?.onlinePrice !== undefined && 
                                           variant?.onlinePrice > 0;
                    
                    const isItemAvailable = !isLoading && isAvailable && isOnlineAvailable && hasOnlinePrice;

                    return (
                      <div
                        key={`${item.id}-${item.variantId}`}
                        className={`bg-white rounded-lg shadow-md p-4 flex gap-4 transition-opacity ${
                          !isItemAvailable ? 'opacity-60' : ''
                        } ${isLoading ? 'animate-pulse' : ''}`}
                      >
                        {/* Image */}
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-amber-900 mb-1 truncate">
                            {item.name}
                          </h3>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {item.variantLabel || 'Regular'}
                          </p>

                          {/* Loading State */}
                          {isLoading && (
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          )}

                          {/* Unavailable Warning */}
                          {!isLoading && !isItemAvailable && (
                            <p className="text-xs text-red-600 mb-2 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {!product 
                                ? 'Product not found' 
                                : !isAvailable 
                                ? 'Product is no longer available'
                                : !isOnlineAvailable || !hasOnlinePrice
                                ? 'No longer available for online order'
                                : 'Unavailable for online order'}
                            </p>
                          )}

                          {/* Variant Selector */}
                          {!isLoading && product?.variants && product.variants.length > 0 && isItemAvailable && (
                            <select
                              value={item.variantId}
                              onChange={(e) => {
                                const selected = product.variants.find(
                                  (v) => v.id === e.target.value
                                );
                                if (selected && selected.onlinePrice && selected.onlinePrice > 0) {
                                  updateVariant(
                                    item.id,
                                    selected.id,
                                    selected.label,
                                    selected.onlinePrice
                                  );
                                }
                              }}
                              className="border border-gray-300 rounded-lg px-3 py-1 mb-2 text-sm w-full max-w-xs"
                            >
                              {product.variants
                                .filter(v => v.onlinePrice !== null && v.onlinePrice !== undefined && v.onlinePrice > 0)
                                .map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.label} - ₱{v.onlinePrice?.toFixed(2)}
                                  </option>
                              ))}
                            </select>
                          )}

                          <p className="text-xl font-semibold text-amber-600">
                            ₱{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col items-end justify-between">
                          <button
                            onClick={() => removeItem(item.id, item.variantId || '')}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                            disabled={isLoading}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>

                          {!isLoading && isItemAvailable && (
                            <div className="flex items-center gap-2 bg-amber-50 rounded-lg">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    item.quantity - 1,
                                    item.variantId || ''
                                  )
                                }
                                disabled={item.quantity <= 1}
                                className="p-2 hover:bg-amber-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Minus className="w-4 h-4 text-amber-700" />
                              </button>

                              <span className="font-semibold text-amber-900 w-8 text-center">
                                {item.quantity}
                              </span>
                              
                              <button
                                disabled={item.quantity >= 99}
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    Math.min(99, item.quantity + 1),
                                    item.variantId || ''
                                  )
                                }
                                className={`p-2 rounded-lg ${
                                  item.quantity >= 99
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-amber-100'
                                }`}
                              >
                                <Plus className="w-4 h-4 text-amber-700" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
                    <h2 className="text-2xl font-bold text-amber-900 mb-6">
                      Order Summary
                    </h2>

                    <div className="space-y-3 text-gray-600 mb-4">
                      <div className="flex justify-between">
                        <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                        <span className="font-medium">₱{totalPrice.toFixed(2)}</span>
                      </div>
                      
                      {/* Valid Items Count */}
                      {hasUnavailableItems && (
                        <div className="text-xs text-red-600 pt-2 border-t">
                          {validItemsCount} valid {validItemsCount === 1 ? 'item' : 'items'} ready for checkout
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between text-xl font-bold text-amber-900 border-t pt-4">
                      <span>Total</span>
                      <span>₱{grandTotal.toFixed(2)}</span>
                    </div>

                    <Link
                      href={hasUnavailableItems ? '#' : '/checkout'}
                      onClick={(e) => {
                        if (hasUnavailableItems) {
                          e.preventDefault();
                          alert('Please remove unavailable items before proceeding to checkout.');
                        } else if (validItemsCount === 0) {
                          e.preventDefault();
                          alert('No valid items in cart.');
                        }
                      }}
                      className={`block w-full py-4 text-white text-center rounded-lg transition-colors font-semibold text-lg mt-6 ${
                        hasUnavailableItems || validItemsCount === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-amber-600 hover:bg-amber-700'
                      }`}
                    >
                      Proceed to Checkout
                    </Link>

                    <Link
                      href="/menu"
                      className="block w-full mt-3 py-3 bg-amber-50 text-amber-900 text-center rounded-lg hover:bg-amber-100 transition-colors font-medium"
                    >
                      Continue Shopping
                    </Link>

                    {/* Quick Actions */}
                    {hasUnavailableItems && (
                      <button
                        onClick={() => {
                          unavailableItems.forEach(item => {
                            removeItem(item.id, item.variantId || '');
                          });
                        }}
                        className="block w-full mt-3 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                      >
                        Remove all unavailable items
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}