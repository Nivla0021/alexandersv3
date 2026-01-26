'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useCartStore } from '@/lib/cart-store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Mail, Phone, MapPin, FileText, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [mounted, setMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const items = useCartStore((state) => state.items ?? []);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const clearCart = useCartStore((state) => state.clearCart);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    orderNotes: '',
    paymentMethod: 'COD',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check authentication and prefill form
  useEffect(() => {
    if (status === 'loading') {
      setCheckingAuth(true);
      return;
    }

    setCheckingAuth(false);

    // If not authenticated, don't prefill
    if (status === 'unauthenticated' || !session) {
      return;
    }

    // Pre-fill form with user data
    if (session.user) {
      setFormData((prev) => ({
        ...prev,
        customerName: (session.user as any).name || '',
        customerEmail: (session.user as any).email || '',
        customerPhone: (session.user as any).phone || '',
        deliveryAddress: (session.user as any).address || '',
      }));
    }
  }, [session, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!items.length) {
      setError('Your cart is empty.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          paymentMethod: formData.paymentMethod.toUpperCase(), // normalize
          userId: (session?.user as any)?.id, // Include user ID for tracking
          items,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create order');
      }

      // ----------------------------
      // COD FLOW
      // ----------------------------
      if (formData.paymentMethod === 'COD') {
        clearCart();
        router.push(`/order-confirmation/${data.order.orderNumber}`);
        return;
      }

      // ----------------------------
      // GCASH / PAYMONGO FLOW
      // Order is NOT created yet
      // Redirect user to PayMongo Checkout
      // ----------------------------
      if (formData.paymentMethod === 'GCASH') {
        if (!data?.checkoutUrl) {
          throw new Error('No checkout URL returned from PayMongo');
        }

        window.location.href = data.checkoutUrl;
        return;
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Something went wrong');
      setLoading(false);
    }
  };

  if (!mounted || checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-b from-amber-50 to-white">
          <div className="container mx-auto max-w-4xl px-4 py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Authentication gate - require login to checkout
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-b from-amber-50 to-white">
          <div className="container mx-auto max-w-2xl px-4 py-12">
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogIn className="w-12 h-12 text-amber-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Login Required
              </h1>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Please log in to your account to proceed with checkout. If you don't have an account yet, you can create one in just a few minutes.
              </p>
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-900">
                  <strong>Why do we require login?</strong>
                </p>
                <p className="text-sm text-amber-800 mt-2">
                  Creating an account helps us keep track of your orders, provide better customer service, and save your delivery information for faster checkout next time.
                </p>
              </div>
              <div className="space-y-3">
                <Link 
                  href={`/auth/login?callbackUrl=/checkout`}
                  className="block w-full py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Log In to Continue
                </Link>
                <Link
                  href="/auth/register"
                  className="block w-full py-3 px-6 bg-white border-2 border-amber-300 text-amber-700 font-semibold rounded-lg hover:bg-amber-50 transition-colors"
                >
                  Create New Account
                </Link>
                <Link
                  href="/cart"
                  className="block text-amber-600 hover:text-amber-700 text-sm font-medium mt-4"
                >
                  ← Back to Cart
                </Link>
              </div>
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
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <h1 className="text-4xl font-bold text-amber-900 mb-8">
            <span className="text-amber-600">Checkout</span>
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">

              <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-2">
                    <User className="inline w-4 h-4 mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    readOnly={true}
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="Juan Dela Cruz"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can update your name in your profile settings.
                  </p>
                </div>
                

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-2">
                    <Mail className="inline w-4 h-4 mr-2" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    readOnly={true}
                    required
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="juan@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-2">
                    <Phone className="inline w-4 h-4 mr-2" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    readOnly={true}
                    required
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="09XX XXX XXXX"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can update your phone number in your profile settings.
                  </p>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-2">
                    <MapPin className="inline w-4 h-4 mr-2" />
                    Delivery Address *
                  </label>
                  <textarea
                    required
                    readOnly={true}
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can update your address in your profile settings.
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-2">
                    <FileText className="inline w-4 h-4 mr-2" />
                    Order Notes (Optional)
                  </label>
                  <textarea
                    value={formData.orderNotes}
                    onChange={(e) => setFormData({ ...formData, orderNotes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-2">
                    Payment Method *
                  </label>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={formData.paymentMethod === 'COD'}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      />
                      <span>Cash on Delivery (COD)</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="GCASH"
                        checked={formData.paymentMethod === 'GCASH'}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      />
                      <span>GCash (via PayMongo)</span>
                    </label>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-lg font-semibold disabled:bg-gray-400"
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-20">
                <h2 className="text-xl font-bold text-amber-900 mb-4">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                  <div
                    key={item.id + (item.variantId || '')}
                    className="flex justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {item.name} × {item.quantity}
                      </p>

                      {item.variantLabel && (
                        <p className="text-xs text-gray-500">
                          Variant: {item.variantLabel}
                        </p>
                      )}
                    </div>

                    <span className="font-semibold">
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                </div>

                <div className="border-t pt-3 flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>₱{totalPrice.toFixed(2)}</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
