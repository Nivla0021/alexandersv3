'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ShoppingBag, TrendingUp, BarChart3, MessageSquare, ShoppingCart, MessageCircle, UtensilsCrossed , UserCheck} from 'lucide-react';
import { StoreManagerHeader } from '@/components/store-manager-header';
export default function AdminDashboardPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState({ todayOrders: 0, totalOrders: 0, totalProducts: 0 });
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !(session?.user as any)?.role || (session?.user as any)?.role !== 'store-manager') {
      router.push('/admin/login');
      return;
    }
    fetchStats();
  }, [status, session, router]);

  const fetchStats = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/admin/fetchOrders'),
        fetch('/api/products'),
      ]);

      const orders = await ordersRes.json();
      const products = await productsRes.json();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = orders?.filter?.((order: any) => {
        const orderDate = new Date(order?.createdAt ?? '');
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      })?.length ?? 0;

      setStats({
        todayOrders,
        totalOrders: orders?.length ?? 0,
        totalProducts: products?.length ?? 0,
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
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
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
        </div>

        

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-amber-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6"> {/* Changed to 3 columns */}

            <Link
              href="/store-manager/orders"
              className="flex items-center space-x-4 p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border-2 border-blue-200"
            >
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 text-lg">Manage Orders</h3>
                <p className="text-sm text-gray-600">View and update order status</p>
              </div>
            </Link>

            <Link
              href="/store-manager/kiosk"
              className="flex items-center space-x-4 p-6 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors border-2 border-yellow-200"
            >
              <div className="w-12 h-12 bg-yellow-600 text-white rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-yellow-900 text-lg">Kiosk</h3>
                <p className="text-sm text-gray-600">Kiosk for customer use</p>
              </div>
            </Link>

            {/* Customer View Panel */}
            <Link
              href="/store-manager/customer-view"
              className="flex items-center space-x-4 p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border-2 border-green-200"
            >
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-green-900 text-lg">Customer View</h3>
                <p className="text-sm text-gray-600">
                  Customers can check their order status using the order number
                </p>
              </div>
            </Link>

            {/* Kitchen View System */}
            <Link
              href="/store-manager/kitchen-view"
              className="flex items-center space-x-4 p-6 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border-2 border-red-200"
            >
              <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-red-900 text-lg">Kitchen View</h3>
                <p className="text-sm text-gray-600">Kitchen monitors orders being prepared</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
