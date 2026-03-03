'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { CreditCard, Truck, ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function OnlineOrdersPage() {
  const { data: session, status } = useSession() || {};
    useEffect(() => {
      if (status === 'loading') return;
  
      if (
        status === 'unauthenticated' ||
        !(session?.user as any)?.role ||
        (session?.user as any)?.role !== 'store-manager'
      ) {
        router.push('/admin/login');
        return;
      }
    }, [status, session]);
  const router = useRouter();
  const [loadingTab, setLoadingTab] = useState<string | null>(null);
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <header className="bg-white shadow-sm border-b border-amber-100 mb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/store-manager/dashboard"
              className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-amber-900" />
            </Link>
            <h1 className="text-2xl font-bold text-amber-900">Confirm Online Orders</h1>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">

            {/* GCash Orders */}
            <div
              onClick={() => {
                setLoadingTab('gcash');
                router.push('/store-manager/online-orders/gcash-orders');
              }}
              className="relative cursor-pointer bg-white rounded-xl shadow-md p-8
                         hover:shadow-lg transition border-2 border-purple-100
                         hover:border-purple-300"
            >
              {loadingTab === 'gcash' && (
                <div className="absolute inset-0 bg-purple-600/70 rounded-xl flex items-center justify-center text-white font-semibold">
                  Loading...
                </div>
              )}

              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-purple-600 text-white rounded-full flex items-center justify-center">
                  <CreditCard className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-purple-900">
                    GCash Orders
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Verify and confirm GCash payments
                  </p>
                </div>
              </div>
            </div>

            {/* COD Orders */}
            <div
              onClick={() => {
                setLoadingTab('cod');
                router.push('/store-manager/online-orders/cod-orders');
              }}
              className="relative cursor-pointer bg-white rounded-xl shadow-md p-8
                         hover:shadow-lg transition border-2 border-gray-200
                         hover:border-gray-400"
            >
              {loadingTab === 'cod' && (
                <div className="absolute inset-0 bg-gray-700/70 rounded-xl flex items-center justify-center text-white font-semibold">
                  Loading...
                </div>
              )}

              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gray-700 text-white rounded-full flex items-center justify-center">
                  <Truck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    COD Orders
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Manage Cash on Delivery orders
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
