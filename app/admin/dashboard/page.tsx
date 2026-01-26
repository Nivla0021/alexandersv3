'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ShoppingBag, TrendingUp, BarChart3, MessageSquare, ShoppingCart, MessageCircle, HelpCircle, Users, Images } from 'lucide-react';
import { AdminHeader } from '@/components/admin-header';
export default function AdminDashboardPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState({ todayOrders: 0, totalOrders: 0, totalProducts: 0 });
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !(session?.user as any)?.role || (session?.user as any)?.role !== 'admin') {
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
      <AdminHeader />
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
                <p className="text-gray-600 text-sm mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-amber-900">{stats.totalOrders}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-blue-600" />
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
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/admin/products"
              className="flex items-center space-x-4 p-6 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors border-2 border-amber-200"
            >
              <div className="w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 text-lg">Manage Products</h3>
                <p className="text-sm text-gray-600">Add, edit, or remove products</p>
              </div>
            </Link>

            <Link
              href="/admin/orders"
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

            {/* NEW — Manage Slider Images */}
            <Link
              href="/admin/slider-images"
              className="flex items-center space-x-4 p-6 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border-2 border-orange-200"
            >
              <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center">
                <Images className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-orange-900 text-lg">Manage Slider Images</h3>
                <p className="text-sm text-gray-600">
                  Add, edit, or remove slider images
                </p>
              </div>
            </Link>

            {/* <Link
              href="/admin/reports"
              className="flex items-center space-x-4 p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border-2 border-green-200"
            >
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-green-900 text-lg">View Sales and Reports</h3>
                <p className="text-sm text-gray-600">
                  See updated sales and reports on specific dates
                </p>
              </div>
            </Link> */}

            <Link
              href="/admin/customer-message"
              className="flex items-center space-x-4 p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border-2 border-purple-200"
            >
              <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-purple-900 text-lg">View Customer Messages</h3>
                <p className="text-sm text-gray-600">
                  View and reply to customer messages
                </p>
              </div>
            </Link>

            {/* NEW — Manage Testimonials */}
            <Link
              href="/admin/testimonials"
              className="flex items-center space-x-4 p-6 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors border-2 border-pink-200"
            >
              <div className="w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-pink-900 text-lg">Manage Testimonials</h3>
                <p className="text-sm text-gray-600">
                  Add, edit, or remove testimonials
                </p>
              </div>
            </Link>

            {/* NEW — Manage FAQ */}
            <Link
              href="/admin/faq"
              className="flex items-center space-x-4 p-6 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors border-2 border-teal-200"
            >
              <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-teal-900 text-lg">Manage FAQ</h3>
                <p className="text-sm text-gray-600">
                  Add, edit, or remove customer FAQs
                </p>
              </div>
            </Link>

            {/* NEW — Manage Users */}
            <Link
              href="/admin/users"
              className="flex items-center space-x-4 p-6 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border-2 border-indigo-200"
            >
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-indigo-900 text-lg">Manage Users</h3>
                <p className="text-sm text-gray-600">
                  View and manage registered accounts
                </p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
