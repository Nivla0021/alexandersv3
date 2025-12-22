'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useCartStore } from '@/lib/cart-store';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((state) => state?.items ?? []);
  const removeItem = useCartStore((state) => state?.removeItem);
  const updateQuantity = useCartStore((state) => state?.updateQuantity);
  const getTotalPrice = useCartStore((state) => state?.getTotalPrice);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-b from-amber-50 to-white">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center py-20">
              <p className="text-gray-600">Loading cart...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalPrice = getTotalPrice?.() ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-amber-900 mb-8">
            Your <span className="text-amber-600">Cart</span>
          </h1>

          {items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-md">
              <ShoppingBag className="w-20 h-20 mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Your cart is empty
              </h2>
              <p className="text-gray-600 mb-8">
                Start adding some delicious Filipino treats!
              </p>
              <Link
                href="/menu"
                className="inline-block px-8 py-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                Browse Menu
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div
                    key={item?.id}
                    className="bg-white rounded-lg shadow-md p-4 flex gap-4"
                  >
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image
                        src={item?.image ?? ''}
                        alt={item?.name ?? 'Product'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-amber-900 mb-1">
                        {item?.name}
                      </h3>
                      <p className="text-xl font-semibold text-amber-600">
                        ₱{item?.price}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => removeItem?.(item?.id ?? '')}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <div className="flex items-center space-x-2 bg-amber-50 rounded-lg">
                        <button
                          onClick={() =>
                            updateQuantity?.(item?.id ?? '', (item?.quantity ?? 1) - 1)
                          }
                          className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                        >
                          <Minus className="w-4 h-4 text-amber-700" />
                        </button>
                        <span className="font-semibold text-amber-900 w-8 text-center">
                          {item?.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity?.(item?.id ?? '', (item?.quantity ?? 0) + 1)
                          }
                          className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4 text-amber-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
                  <h2 className="text-2xl font-bold text-amber-900 mb-6">
                    Order Summary
                  </h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal</span>
                      <span className="font-semibold">₱{totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-xl font-bold text-amber-900">
                        <span>Total</span>
                        <span>₱{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/checkout"
                    className="block w-full py-4 bg-amber-600 text-white text-center rounded-lg hover:bg-amber-700 transition-colors font-semibold text-lg"
                  >
                    Proceed to Checkout
                  </Link>
                  <Link
                    href="/menu"
                    className="block w-full mt-3 py-3 bg-amber-50 text-amber-900 text-center rounded-lg hover:bg-amber-100 transition-colors font-medium"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
