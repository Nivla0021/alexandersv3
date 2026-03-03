'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Package, ShoppingBag, TrendingUp, CheckCircle, MessageSquare, 
  Settings, MessageCircle, HelpCircle, Users, Images, CreditCard,
  Tag, QrCode, Clock, CheckCircle2, XCircle // Add these icons
} from 'lucide-react';
import { AdminHeader } from '@/components/admin-header';

// Define stats interface
interface Stats {
  todayOrders: number;
  totalOrders: number;
  totalProducts: number;
  gcashPendingOrders: number;
  pendingDiscounts: number; // Add this
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ 
    todayOrders: 0, 
    totalOrders: 0, 
    totalProducts: 0, 
    gcashPendingOrders: 0,
    pendingDiscounts: 0 // Initialize
  });
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
      // Fetch regular stats
      const response = await fetch('/api/admin/stats');
      const statsData = await response.json();

      // Fetch pending discount applications
      const discountResponse = await fetch('/api/admin/discounts?status=PENDING');
      const discountData = await discountResponse.json();

      setStats({
        todayOrders: statsData.todayOrders || 0,
        totalOrders: statsData.totalOrders || 0,
        totalProducts: statsData.totalProducts || 0,
        gcashPendingOrders: statsData.gcashPendingOrders || 0,
        pendingDiscounts: discountData.applications?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      fetchStatsLegacy();
    } finally {
      setLoading(false);
    }
  };

  // Legacy method as fallback
  const fetchStatsLegacy = async () => {
    try {
      const [ordersRes, productsRes, discountRes] = await Promise.all([
        fetch('/api/admin/fetchOrders'),
        fetch('/api/products'),
        fetch('/api/admin/discounts?status=PENDING'),
      ]);

      const orders = await ordersRes.json();
      const products = await productsRes.json();
      const discountData = await discountRes.json();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = orders?.filter?.((order: any) => {
        const orderDate = new Date(order?.createdAt ?? '');
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      })?.length ?? 0;

      const gcashPendingOrders = orders?.filter?.((order: any) => 
        order.paymentMethod === 'GCASH' && 
        (order.paymentStatus === 'awaiting_payment' || order.paymentStatus === 'verifying')
      )?.length ?? 0;

      setStats({
        todayOrders,
        totalOrders: orders?.length ?? 0,
        totalProducts: products?.length ?? 0,
        gcashPendingOrders,
        pendingDiscounts: discountData.applications?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching legacy stats:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col">
        <AdminHeader />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <AdminHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - Add Pending Discounts */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Today&apos;s Orders</p>
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

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">GCash Pending</p>
                <p className="text-3xl font-bold text-amber-900">{stats.gcashPendingOrders}</p>
              </div>
              <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* NEW: Pending Discounts Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Discount Applications</p>
                <p className="text-3xl font-bold text-amber-900">{stats.pendingDiscounts}</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                <Tag className="w-7 h-7 text-purple-600" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">
                Pending approval
              </p>
              {stats.pendingDiscounts > 0 && (
                <Link 
                  href="/admin/discounts" 
                  className="inline-block mt-2 text-xs text-purple-600 hover:text-purple-800 font-medium"
                >
                  Review now →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-amber-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
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

            <Link
              href="/admin/gcash-orders"
              className="flex items-center space-x-4 p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border-2 border-green-200"
            >
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-green-900 text-lg">Verify GCash Payments</h3>
                <p className="text-sm text-gray-600">Confirm and verify GCash payments</p>
                {stats.gcashPendingOrders > 0 && (
                  <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    {stats.gcashPendingOrders} pending
                  </span>
                )}
              </div>
            </Link>

            {/* NEW: Discount Approvals Link */}
            <Link
              href="/admin/discounts"
              className="flex items-center space-x-4 p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border-2 border-purple-200"
            >
              <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-purple-900 text-lg">Discount Approvals</h3>
                <p className="text-sm text-gray-600">Review PWD/Senior applications</p>
                {stats.pendingDiscounts > 0 && (
                  <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    {stats.pendingDiscounts} pending
                  </span>
                )}
              </div>
            </Link>

            <Link
              href="/admin/gcash-qr-codes"
              className="flex items-center space-x-4 p-6 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors border-2 border-emerald-200"
            >
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-900 text-lg">GCash QR Codes</h3>
                <p className="text-sm text-gray-600">Manage payment QR codes</p>
              </div>
            </Link>

            <Link
              href="/admin/slider-images"
              className="flex items-center space-x-4 p-6 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border-2 border-orange-200"
            >
              <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center">
                <Images className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-orange-900 text-lg">Manage Slider Images</h3>
                <p className="text-sm text-gray-600">Add, edit, or remove slider images</p>
              </div>
            </Link>

            <Link
              href="/admin/admin-settings"
              className="flex items-center space-x-4 p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border-2 border-purple-200"
            >
              <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-purple-900 text-lg">Settings</h3>
                <p className="text-sm text-gray-600">System & store configuration</p>
              </div>
            </Link>

            <Link
              href="/admin/customer-message"
              className="flex items-center space-x-4 p-6 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors border-2 border-pink-200"
            >
              <div className="w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-pink-900 text-lg">View Customer Messages</h3>
                <p className="text-sm text-gray-600">View and reply to customer messages</p>
              </div>
            </Link>

            <Link
              href="/admin/testimonials"
              className="flex items-center space-x-4 p-6 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors border-2 border-teal-200"
            >
              <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-teal-900 text-lg">Manage Testimonials</h3>
                <p className="text-sm text-gray-600">Add, edit, or remove testimonials</p>
              </div>
            </Link>

            <Link
              href="/admin/faq"
              className="flex items-center space-x-4 p-6 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border-2 border-indigo-200"
            >
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-indigo-900 text-lg">Manage FAQ</h3>
                <p className="text-sm text-gray-600">Add, edit, or remove customer FAQs</p>
              </div>
            </Link>

            <Link
              href="/admin/users"
              className="flex items-center space-x-4 p-6 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors border-2 border-cyan-200"
            >
              <div className="w-12 h-12 bg-cyan-600 text-white rounded-full flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-cyan-900 text-lg">Manage Users</h3>
                <p className="text-sm text-gray-600">View and manage registered accounts</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-amber-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {stats.pendingDiscounts > 0 && (
              <div className="flex items-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <Tag className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-purple-900">
                    {stats.pendingDiscounts} discount application{stats.pendingDiscounts !== 1 ? 's' : ''} pending review
                  </p>
                  <Link 
                    href="/admin/discounts" 
                    className="text-sm text-purple-700 hover:text-purple-800 font-medium"
                  >
                    Review now →
                  </Link>
                </div>
              </div>
            )}
            
            {stats.gcashPendingOrders > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <CreditCard className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-yellow-900">
                    {stats.gcashPendingOrders} GCash payment{stats.gcashPendingOrders !== 1 ? 's' : ''} awaiting verification
                  </p>
                  <Link 
                    href="/admin/gcash-orders" 
                    className="text-sm text-yellow-700 hover:text-yellow-800 font-medium"
                  >
                    Verify now →
                  </Link>
                </div>
              </div>
            )}
            
            <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-900">
                  {stats.todayOrders} order{stats.todayOrders !== 1 ? 's' : ''} placed today
                </p>
                <Link 
                  href="/admin/orders" 
                  className="text-sm text-blue-700 hover:text-blue-800 font-medium"
                >
                  View all orders →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}