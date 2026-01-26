'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, CheckCircle, ShoppingBag } from 'lucide-react';

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
  const [selectedNotes, setSelectedNotes] = useState<string | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
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
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/fetchOrders`,
        { cache: 'no-store' }
      );

      const data = await response.json();
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
      if (status === 'confirmed') return ['preparing'];
      if (status === 'preparing') return ['ready for pickup'];
      if (status === 'ready for pickup') return ["order claimed"];
      if (status === 'order claimed') return [];
      return [];
    }

    // === KIOSK FLOW ===
    if (source === 'KIOSK') {
      if (status === 'confirmed') return ['preparing'];
      if (status === 'preparing') return ['ready to serve'];
      if (status === 'ready to serve') return ["order claimed"];
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
    const matchesStatus = ['confirmed', 'preparing', 'ready for pickup', 'ready to serve', 'order claimed']
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

 const printReceipt = (order: Order) => {
    const win = window.open('', '_blank', 'width=300,height=600');
    if (!win) return;

    const isOnline = order.orderSource?.toUpperCase() === 'ONLINE';
    const lineWidth = 32; // Approx chars per line for 58mm printer

    // Helper to format a line with qty, name, price
    const formatLine = (qty: number, name: string, price: number) => {
      const qtyStr = String(qty).padStart(2, ' ');
      // Truncate name if too long
      const maxNameLength = lineWidth - 2 - 1 - 8; // qty + space + price width
      const nameStr = name.length > maxNameLength ? name.slice(0, maxNameLength - 1) + '…' : name;
      const priceStr = `₱${price.toFixed(2)}`;
      const spaces = ' '.repeat(lineWidth - qtyStr.length - 1 - nameStr.length - priceStr.length);
      return `${qtyStr} ${nameStr}${spaces}${priceStr}`;
    };

    const itemsText = order.orderItems.map(item => formatLine(item.quantity, item.product.name, item.price)).join('<br>');

    const customerFields = isOnline
      ? `
        <p>Name: ${order.customerName}</p>
        <p>Email: ${order.customerEmail}</p>
        <p>Phone: ${order.customerPhone}</p>
        <p>Address: ${order.deliveryAddress}</p>
      `
      : `<p>Name: Walk-in</p>`;

    win.document.write(`
      <html>
        <head>
          <title>Receipt ${order.orderNumber}</title>
          <style>
            body {
              font-family: monospace;
              font-size: 12px;
              line-height: 1.2;
              width: 250px; /* 58mm printer width */
              padding: 4px 0;
            }
            hr { border: 1px dashed #000; margin: 4px 0; }
            .center { text-align: center; }
            .right { text-align: right; }
            .footer { font-size: 10px; text-align: center; margin-top: 4px; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="center bold">Alexander's</div>
          <div class="center">*** Receipt ***</div>
          <hr>
          <p>Order #: ${order.orderNumber}</p>
          <p>Transaction #: ${order.transactionNumber}</p>
          <p>Source: ${order.orderSource}</p>
          <p>Mode: ${order.orderMode || 'N/A'}</p>

          <hr>
          <div class="bold">Customer Info:</div>
          ${customerFields}

          <hr>
          <div class="bold">Items:</div>
          <p>${itemsText}</p>

          <hr>
          <p>Subtotal: ₱${order.subtotal.toFixed(2)}</p>
          <p>Total: ₱${order.total.toFixed(2)}</p>
          <p>Payment: ${order.paymentMethod} (${order.paymentStatus})</p>

          <hr>
          <div class="footer">
            <p>Printed: ${new Date().toLocaleString()}</p>
            <p>Thank you for your order!</p>
          </div>
        </body>
      </html>
    `);

    win.document.close();
    win.print();
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

        {todayOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">No orders today</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {todayOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-md p-6 flex flex-col h-full"
            >
              {/* Top section */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold">{order.orderNumber}</h3>

                  {order.transactionNumber && (
                    <p className="text-xs text-gray-600 font-medium">
                      TXN: {order.transactionNumber}
                    </p>
                  )}

                  {order.orderMode && (
                    <span
                      className={`mt-1 w-fit px-2 py-0.5 rounded-md text-xs font-medium uppercase ${getModeColor(
                        order.orderMode
                      )}`}
                    >
                      {order.orderMode}
                    </span>
                  )}
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                    order.orderStatus
                  )}`}
                >
                  {order.orderStatus}
                </span>
              </div>

              <span className="mt-1 w-fit px-2 py-0.5 rounded-md text-xs font-medium uppercase">
                {order.orderSource}
              </span>

              {/* Middle content */}
              <div className="border-t pt-3 space-y-1 flex-1">
                {order.orderItems.map((item) => (
                  <p key={item.id} className="text-sm flex justify-between">
                    <span>
                      <strong>{item.quantity}x</strong> {item.product.name}
                    </span>
                    <span className="font-medium">
                      {formatPhp(item.price * item.quantity)}
                    </span>
                  </p>
                ))}

                <div className="border-t mt-2 pt-2 text-sm font-semibold flex justify-between">
                  <span>Total:</span>
                  <span>₱{order.total ?? order.subtotal ?? 0}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-4 flex flex-col gap-2">
                {order.orderSource === 'ONLINE' && order.orderNotes && (
                  <button
                    onClick={() => {
                      setSelectedNotes(order.orderNotes as string);
                      setShowNotesModal(true);
                    }}
                    className="w-full py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium text-sm"
                  >
                    View Order Notes
                  </button>
                )}

                <button
                  onClick={() => printReceipt(order)}
                  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                >
                  Print Receipt
                </button>

                {getNextStatuses(order).length > 0 && (
                  <button
                    onClick={() => {
                      const next = getNextStatuses(order)?.[0];

                      let finalValue = next;

                      if (order.orderSource === 'ONLINE') {
                        // Online Orders: claimed → out for delivery
                        if (next === 'order claimed') finalValue = 'out for delivery';
                      } else {
                        // Kiosk / Dine-In: claimed → completed
                        if (next === 'order claimed') finalValue = 'completed';
                      }

                      updateOrderStatus(order.id, finalValue);
                    }}
                    className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm"
                  >
                    {getNextStatuses(order)[0]}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

        {showNotesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full space-y-4">
              <h2 className="text-lg font-bold text-amber-900">Customer Notes</h2>

              <p className="text-sm text-gray-700 whitespace-pre-line">
                {selectedNotes}
              </p>

              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setSelectedNotes(null);
                }}
                className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );

}
