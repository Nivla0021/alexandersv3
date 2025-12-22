'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useState, useEffect } from 'react';
import { CheckCircle, Clipboard, Home } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || '';
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const clearCart = useCartStore((state) => state.clearCart);

  // 🔥 Clear cart ONLY once on page load
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const handleCopy = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-8 text-center max-w-lg space-y-6">
          <CheckCircle className="mx-auto w-12 h-12 text-amber-600" />
          <h1 className="text-3xl font-bold text-amber-900">Payment Successful!</h1>
          <p className="text-gray-700">
            Thank you! Your order has been confirmed and paid successfully.
          </p>

          <div className="flex items-center justify-center space-x-2 bg-amber-50 p-4 rounded-lg border border-amber-200">
            <span className="font-semibold text-amber-900">{orderNumber}</span>
            <button
              onClick={handleCopy}
              className="p-2 bg-amber-200 rounded hover:bg-amber-300 transition-colors"
            >
              <Clipboard className="w-5 h-5 text-amber-900" />
            </button>
          </div>

          {copied && <p className="text-green-600 text-sm">Copied to clipboard!</p>}

          <button
            onClick={() => router.push('/')}
            className="mt-4 w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center space-x-2 font-semibold"
          >
            <Home className="w-5 h-5" />
            <span>Return to Home</span>
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
