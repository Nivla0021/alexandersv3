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
const BATCH_SIZE = 12; // Orders per column
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
        // console.log(data)

        // Filter completed orders for today
        const today = new Date();
        const filtered = data.filter(order => {
          const date = new Date(order.createdAt);
          const isToday = date.getFullYear() === today.getFullYear() &&
                          date.getMonth() === today.getMonth() &&
                          date.getDate() === today.getDate();
          return isToday && (order.orderStatus.toLowerCase() === 'mark as ready' || order.orderStatus.toLowerCase() === 'preparing');
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

  const getBatchedOrders = (type: 'PREPARING' | 'IN-STORE' | 'ONLINE') => {
    let filtered: Order[] = [];

    if (type === 'PREPARING') {
        filtered = orders.filter(o => o.orderStatus.toLowerCase() === 'preparing' && (o.orderMode === 'DINE-IN' || o.orderMode === 'TAKEOUT' || o.orderSource === "ONLINE"));
    } else if (type === 'IN-STORE') {
        filtered = orders.filter(o => o.orderStatus.toLowerCase() === 'mark as ready' && o.orderSource === "KIOSK");
    }else if (type === 'ONLINE') {
        filtered = orders.filter(o => o.orderSource?.toUpperCase() === 'ONLINE' && o.orderStatus === "mark as ready");
    }

    const chunks: Order[][] = [];
    for (let i = 0; i < filtered.length; i += BATCH_SIZE) {
        chunks.push(filtered.slice(i, i + BATCH_SIZE));
    }

    if (chunks.length === 0) chunks.push([]);
    return chunks[batchIndex % chunks.length];
    };

  const preparingOrders = getBatchedOrders('PREPARING');
  const inStoreOrders = getBatchedOrders('IN-STORE');
  const onlineOrders = getBatchedOrders('ONLINE');

  return (
    <div className="min-h-screen bg-[#F6F6F6] xl:space-y-8 space-y-6">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 lg:px-6 2xl:px-10 lg:py-4 py-3 bg-[#059669]">
          <div className="flex items-center xl:space-x-4 space-x-2 2xl:text-[30px] xl:text-[25px] lg:text-[22px] text-[20px]">
            <Link
              href="/store-manager/dashboard"
              className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="lg:w-6 w-5 lg:h-6 h-5 text-white" />
            </Link>
            <h1 className=" font-bold text-white">Order Status</h1>
          </div>
        </div>
      </header>

      {/* Orders Columns */}
      <main className="px-4 lg:px-6 2xl:px-10 ">
        <div className="grid grid-cols-1 md:grid-cols-3 2xl:gap-6 lg:gap-5  gap-4 lg:h-[85vh] md:h-[87vh] h-auto">
          {/* Dine-in */}
          <div className="2xl:text-[30px] xl:text-[25px] lg:text-[22px] text-[20px] bg-white rounded-xl shadow-md xl:p-8 p-5 xl:space-y-6 space-y-4 ">
            <h2 className=" font-semibold text-center tracking-[1px]">PREPARING</h2>
            <ul className=" grid lg:grid-cols-2 md:grid-cols-1 grid-cols-2  items-center xl:gap-4 gap-2">
              {preparingOrders.map(order => (
                <li key={order.id} className="border rounded-lg font-mono text-center xl:p-4 p-2 bg-[#F8F8F8]">
                  {order.orderNumber}
                </li>
              ))}
            </ul>
          </div>

          {/* Take-out */}
          <div className="2xl:text-[30px] xl:text-[25px] lg:text-[22px] text-[20px] bg-white rounded-xl shadow-md xl:p-8 p-5 xl:space-y-6 space-y-4 ">
            <h2 className="font-semibold text-center tracking-[1px]">NOW SERVING</h2>
            <ul className="grid lg:grid-cols-2 md:grid-cols-1  grid-cols-2 items-center xl:gap-4 gap-2">
              {inStoreOrders.map(order => (
                <li key={order.id} className="border rounded-lg font-mono text-center xl:p-4 p-2 bg-[#F8F8F8]">
                  {order.orderNumber}
                </li>
              ))}
            </ul>
          </div>

          {/* Online */}
          <div className="2xl:text-[30px] xl:text-[25px] lg:text-[22px] text-[20px] bg-white rounded-xl shadow-md xl:p-8 p-5 xl:space-y-6 space-y-4 ">
            <h2 className="font-semibold text-center tracking-[1px] uppercase">Ready for pickup</h2>
            <ul className="grid lg:grid-cols-2 md:grid-cols-1  grid-cols-2 items-center xl:gap-4 gap-2">
              {onlineOrders.map(order => (
                <li key={order.id} className="border rounded-lg font-mono text-center xl:p-4 p-2 bg-[#F8F8F8]">
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
