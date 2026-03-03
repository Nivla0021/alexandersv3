'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ShoppingBag, TrendingUp, BarChart3, MessageSquare, ShoppingCart, ClipboardCheck, UtensilsCrossed, UserCheck, Smartphone, Clock } from 'lucide-react';
import { StoreManagerHeader } from '@/components/store-manager-header';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState({ 
    todayOrders: 0, 
    totalOrders: 0, 
    totalProducts: 0,
    verifyingGcashOrders: 0 // New stat for orders under verification
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !(session?.user as any)?.role || (session?.user as any)?.role !== 'store-manager') {
      router.push('/admin/login');
      return;
    }
    fetchStats();
  }, [status, session, router]);

  const Spinner = () => (
    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
  );

  const fetchStats = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/admin/fetchOrders'),
        fetch('/api/products'),
      ]);

      const orders = await ordersRes.json();
      const products = await productsRes.json();

      console.log(orders);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = orders?.filter?.((order: any) => {
        const orderDate = new Date(order?.createdAt ?? '');
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      })?.length ?? 0;


      // Count GCash orders under verification (paid but not confirmed)
      const verifyingGcashOrders = orders?.filter?.((order: any) => 
        order.paymentMethod === 'GCASH' && 
        order.paymentStatus === 'verifying' &&
        order.orderStatus === 'pending'
      )?.length ?? 0;

      setStats({
        todayOrders,
        totalOrders: orders?.length ?? 0,
        totalProducts: products?.length ?? 0,
        verifyingGcashOrders
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <StoreManagerHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - Now 4 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Today's Orders</p>
                <p className="text-3xl font-bold text-amber-900">{stats.todayOrders}</p>
              </div>
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Products</p>
                <p className="text-3xl font-bold text-amber-900">{stats.totalProducts}</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </div>

          {/* New: Verifying GCash Orders Card */}
          <div 
            onClick={() => router.push('/store-manager/online-orders/gcash-orders?status=verifying')}
            className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-purple-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Verify GCash</p>
                <p className="text-3xl font-bold text-purple-600">{stats.verifyingGcashOrders}</p>
                <p className="text-xs text-gray-500 mt-1">Payment submitted</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="w-7 h-7 text-purple-600" />
              </div>
            </div>
            {stats.verifyingGcashOrders > 0 && (
              <div className="mt-2 text-xs text-purple-600 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
                {stats.verifyingGcashOrders} order{stats.verifyingGcashOrders !== 1 ? 's' : ''} under verification
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-amber-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">

            <div
              onClick={() => {
                setActionLoading('orders');
                router.push('/store-manager/orders');
              }}
              className="relative flex items-center space-x-4 p-6 bg-blue-50 rounded-lg
                        hover:bg-blue-100 transition-colors border-2 border-blue-200
                        cursor-pointer"
            >
              {actionLoading === 'orders' && (
                <div className="absolute inset-0 bg-blue-600/70 rounded-lg flex items-center justify-center z-10">
                  <Spinner />
                </div>
              )}

              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-bold text-blue-900 text-lg">Manage Orders</h3>
                <p className="text-sm text-gray-600">View and update order status</p>
              </div>
            </div>

            <div
              onClick={() => {
                setActionLoading('kiosk');
                router.push('/store-manager/kiosk');
              }}
              className="relative flex items-center space-x-4 p-6 bg-yellow-50 rounded-lg
                        hover:bg-yellow-100 transition-colors border-2 border-yellow-200
                        cursor-pointer"
            >
              {actionLoading === 'kiosk' && (
                <div className="absolute inset-0 bg-yellow-600/70 rounded-lg flex items-center justify-center z-10">
                  <Spinner />
                </div>
              )}

              <div className="w-12 h-12 bg-yellow-600 text-white rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-yellow-900 text-lg">Kiosk</h3>
                <p className="text-sm text-gray-600">Kiosk for customer use</p>
              </div>
            </div>

            <div
              onClick={() => {
                setActionLoading('customerView');
                router.push('/store-manager/customer-view');
              }}
              className="relative flex items-center space-x-4 p-6 bg-green-50 rounded-lg
                        hover:bg-green-100 transition-colors border-2 border-green-200
                        cursor-pointer"
            >
              {actionLoading === 'customerView' && (
                <div className="absolute inset-0 bg-green-600/70 rounded-lg flex items-center justify-center z-10">
                  <Spinner />
                </div>
              )}

              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-green-900 text-lg">Customer View</h3>
                <p className="text-sm text-gray-600">
                  Customers can check their order status using the order number
                </p>
              </div>
            </div>

            <div
              onClick={() => {
                setActionLoading('kitchenView');
                router.push('/store-manager/kitchen-view');
              }}
              className="relative flex items-center space-x-4 p-6 bg-red-50 rounded-lg
                        hover:bg-red-100 transition-colors border-2 border-red-200
                        cursor-pointer"
            >
              {actionLoading === 'kitchenView' && (
                <div className="absolute inset-0 bg-red-600/70 rounded-lg flex items-center justify-center z-10">
                  <Spinner />
                </div>
              )}

              <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-red-900 text-lg">Kitchen View</h3>
                <p className="text-sm text-gray-600">Kitchen monitors orders being prepared</p>
              </div>
            </div>

            <div
              onClick={() => {
                setActionLoading('confirmOnlineOrders');
                router.push('/store-manager/online-orders/gcash-orders');
              }}
              className="relative flex items-center space-x-4 p-6 bg-blue-50 rounded-lg
                        hover:bg-blue-100 transition-colors border-2 border-blue-200
                        cursor-pointer"
            >
              {actionLoading === 'confirmOnlineOrders' && (
                <div className="absolute inset-0 bg-blue-600/70 rounded-lg flex items-center justify-center z-10">
                  <Spinner />
                </div>
              )}

              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-lg">Confirm Online Orders</h3>
                <p className="text-sm text-gray-600">
                  Review and confirm orders placed online
                </p>
                {/* Notification badge for pending orders */}
                {stats.verifyingGcashOrders > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {stats.verifyingGcashOrders > 9 ? '9+' : stats.verifyingGcashOrders}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Optional: Add a refresh button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              setLoading(true);
              fetchStats();
            }}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Stats
          </button>
        </div>
      </main>
    </div>
  );
}