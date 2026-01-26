'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, CheckCircle, ShoppingBag } from 'lucide-react';
import { OrderCard } from '@/components/order-card';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  orderStatus: string;
  createdAt: string;
  orderItems: {
    id: string;
    quantity: number;
    price: number;
    variantLabel?: string | null; // added
    product: {
      name: string;
    };
  }[];
  orderSource: string;
  subtotal: number;
  total: number;
  orderMode?: string;
  transactionNumber?: string;
  orderNotes?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'KIOSK' | 'ONLINE'>('ALL');

  const formatPhp = (amount: number) =>
    amount.toLocaleString('en-PH', {
      style: 'currency',
      currency: 'PHP'
  });


  // Fetch ----------------------------------------------------------------------------------------
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

    const fetchOrdersInterval = () => {
      fetchOrders();
      const intervalId = setInterval(fetchOrders, 5000); // every 5 seconds
      return intervalId;
    };

    const intervalId = fetchOrdersInterval();

    return () => clearInterval(intervalId);
  }, [status, session]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/fetchOrdersToday`,
        { cache: 'no-store' }
      );

      const data = await response.json();
      console.log('Fetched orders data:', data);
      setOrders(data ?? []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextStatuses = (order: Order) => {
    const source = order.orderSource?.toUpperCase();
    const status = order.orderStatus.toLowerCase();

    // === ONLINE FLOW ===
    if (source === 'ONLINE') {
      if (status === 'confirmed') return ['to prepare'];
      if (status === 'mark as ready') return ["order claimed"];
      if (status === 'order claimed') return [];
      return [];
    }

    // === KIOSK FLOW ===
    if (source === 'KIOSK') {
      if (status === 'confirmed') return ['to prepare'];
      if (status === 'mark as ready') return ["order claimed"];
      if (status === 'order claimed') return [];
      return [];
    }

    return [];
  };

  // Update Status --------------------------------------------------------------------------------
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, orderStatus: newStatus })
      });

      if (response.ok) fetchOrders();
    } catch (error) {
      console.error('Error updating:', error);
    }
  };

  // Limit to TODAY --------------------------------------------------------------------------------
  const isToday = (date: string) => {
    const order = new Date(date);
    const today = new Date();
    return (
      order.getFullYear() === today.getFullYear() &&
      order.getMonth() === today.getMonth() &&
      order.getDate() === today.getDate()
    );
  };

  const todayOrders = orders.filter((o) => {
    const matchesStatus = ['confirmed', 'mark as ready', 'order claimed']
      .includes(o.orderStatus.toLowerCase());

    const matchesDate = isToday(o.createdAt);

    const q = debouncedSearch.toLowerCase();

    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.transactionNumber?.toLowerCase().includes(q);

    const matchesSource =
      sourceFilter === 'ALL' || o.orderSource === sourceFilter;

    return matchesStatus && matchesDate && matchesSearch && matchesSource;
  });
  // Status Color ----------------------------------------------------------------------------------
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-purple-100 text-purple-800';
      case 'ready for pickup':
        return 'bg-orange-100 text-orange-800';
      case 'ready to serve':
        return 'bg-orange-100 text-orange-800';
      case 'order claimed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode?.toUpperCase()) {
      case 'DINE-IN':
        return 'bg-green-100 text-green-800';
      case 'TAKE-OUT':
      case 'TAKEOUT':
        return 'bg-indigo-100 text-indigo-800';
      case 'ONLINE':
        return 'bg-blue-100 text-blue-800';
      case 'KIOSK':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };



  // UI Loading ------------------------------------------------------------------------------------
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <p className="text-gray-600">Loading orders...</p>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
    {/* Header */}
    <header className="bg-white shadow-sm border-b border-amber-100 mb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/store-manager/dashboard"
            className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-amber-900" />
          </Link>
          <h1 className="text-2xl font-bold text-amber-900">Manage Orders</h1>
        </div>
      </div>
    </header>

    {/* Orders List */}
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search order # or transaction #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />

        <select
          className="border rounded px-3 py-2"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as any)}
        >
          <option value="ALL">All</option>
          <option value="KIOSK">Kiosk</option>
          <option value="ONLINE">Online</option>
        </select>
      </div>

      {/* Split orders into two arrays */}
      {(() => {
        const newOrders = todayOrders.filter(
          (order) => order.orderStatus !== 'mark as ready'
        );
        const toClaimOrders = todayOrders.filter(
          (order) => order.orderStatus === 'mark as ready'
        );

        return (
          <>
            {/* NEW ORDERS */}
            <h2 className="text-xl font-bold mb-2">
              New Orders <span className="text-sm text-gray-500">({newOrders.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {newOrders.length === 0 ? (
                <p className="text-gray-500 mt-4">No new orders</p>
              ) : (
                newOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    showCancel={true} // show cancel button for new order
                    updateOrderStatus={updateOrderStatus}
                    getNextStatuses={getNextStatuses}
                    getModeColor={getModeColor}
                    getStatusColor={getStatusColor}
                    formatPhp={formatPhp}
                  />
                ))
              )}
            </div>

            {/* TO CLAIM ORDERS */}
            <h2 className="text-xl font-bold mb-2">
              To Claim Orders <span className="text-sm text-gray-500">({toClaimOrders.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {toClaimOrders.length === 0 ? (
                <p className="text-gray-500 mt-4">No orders ready for claim</p>
              ) : (
                toClaimOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    showCancel={false} // hide cancel button for to-claim orders
                    updateOrderStatus={updateOrderStatus}
                    getNextStatuses={getNextStatuses}
                    getModeColor={getModeColor}
                    getStatusColor={getStatusColor}
                    formatPhp={formatPhp}
                  />
                ))
              )}
            </div>
          </>
        );
      })()}
    </main>
  </div>
);


}
