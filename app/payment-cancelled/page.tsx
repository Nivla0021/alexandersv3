'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { XCircle, Home, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PaymentCancelledPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || null;
  const [updating, setUpdating] = useState(false);

  // Update order status when payment is cancelled
  useEffect(() => {
    if (orderNumber && !updating) {
      setUpdating(true);
      fetch('/api/payment-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('✅ Order marked as payment failed');
        } else {
          console.warn('⚠️ Failed to update order:', data.error);
        }
      })
      .catch(err => console.error('❌ Failed to update order:', err))
      .finally(() => setUpdating(false));
    }
  }, [orderNumber, updating]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-8 text-center max-w-lg space-y-6">
          <XCircle className="mx-auto w-12 h-12 text-red-500" />
          
          <h1 className="text-3xl font-bold text-amber-900">Payment Cancelled</h1>
          <p className="text-gray-700">
            Your payment was not completed. You can try again or return to the homepage.
          </p>

          {orderNumber && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              <p><strong>Order Number:</strong> {orderNumber}</p>
              <p className="text-xs mt-1">This order remains unpaid.</p>
            </div>
          )}

          {/* Try Again Button */}
          <button
            onClick={() => router.push('/checkout')}
            className="w-full py-3 bg-gray-200 text-amber-900 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2 font-semibold"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Try Again</span>
          </button>

          {/* Home Button */}
          <button
            onClick={() => router.push('/')}
            className="mt-2 w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center space-x-2 font-semibold"
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
