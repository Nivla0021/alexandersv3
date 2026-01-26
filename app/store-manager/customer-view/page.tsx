'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  orderSource: string;
  orderMode: string | null;
  orderStatus: string;
  createdAt: string;
}

// Settings
const BATCH_SIZE = 4; // Orders per column
const ROTATE_INTERVAL = 5 * 1000; // Rotate every 10 seconds

export default function CustomerPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);

  // Fetch orders every 5 seconds
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/fetchOrders`, { cache: 'no-store' });
        const data: Order[] = await res.json();

        // Filter completed orders for today
        const today = new Date();
        const filtered = data.filter(order => {
          const date = new Date(order.createdAt);
          const isToday = date.getFullYear() === today.getFullYear() &&
                          date.getMonth() === today.getMonth() &&
                          date.getDate() === today.getDate();
          return isToday && order.orderStatus.toLowerCase() === 'mark as ready';
        });
        console.log('Fetched orders:', filtered);
        setOrders(filtered);
      } catch (err) {
        console.error('Error fetching orders:', err);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rotate batches every ROTATE_INTERVAL
  useEffect(() => {
    const rotate = setInterval(() => {
      setBatchIndex(prev => prev + 1);
    }, ROTATE_INTERVAL);
    return () => clearInterval(rotate);
  }, []);

  const getBatchedOrders = (type: 'DINE-IN' | 'TAKEOUT' | 'ONLINE') => {
    let filtered: Order[] = [];

    if (type === 'DINE-IN') {
        filtered = orders.filter(o => o.orderMode?.toUpperCase() === 'DINE-IN');
    } else if (type === 'TAKEOUT') {
        filtered = orders.filter(o => o.orderMode?.toUpperCase() === 'TAKEOUT');
    } else if (type === 'ONLINE') {
        filtered = orders.filter(o => o.orderSource?.toUpperCase() === 'ONLINE');
    }

    const chunks: Order[][] = [];
    for (let i = 0; i < filtered.length; i += BATCH_SIZE) {
        chunks.push(filtered.slice(i, i + BATCH_SIZE));
    }

    if (chunks.length === 0) chunks.push([]);
    return chunks[batchIndex % chunks.length];
    };

  const dineInOrders = getBatchedOrders('DINE-IN');
  const takeOutOrders = getBatchedOrders('TAKEOUT');
  const onlineOrders = getBatchedOrders('ONLINE');

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
            <h1 className="text-2xl font-bold text-amber-900">Customer Order Display</h1>
          </div>
        </div>
      </header>

      {/* Orders Columns */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dine-in */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="font-semibold mb-4 text-center">Ready to Serve (Dine-in)</h2>
            <ul className="space-y-2">
              {dineInOrders.map(order => (
                <li key={order.id} className="text-xl font-mono text-center border-b pb-1">
                  {order.orderNumber}
                </li>
              ))}
            </ul>
          </div>

          {/* Take-out */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="font-semibold mb-4 text-center">Ready to Pick Up (Take-out)</h2>
            <ul className="space-y-2">
              {takeOutOrders.map(order => (
                <li key={order.id} className="text-xl font-mono text-center border-b pb-1">
                  {order.orderNumber}
                </li>
              ))}
            </ul>
          </div>

          {/* Online */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="font-semibold mb-4 text-center">Ready to Deliver (Online)</h2>
            <ul className="space-y-2">
              {onlineOrders.map(order => (
                <li key={order.id} className="text-xl font-mono text-center border-b pb-1">
                  {order.orderNumber}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
