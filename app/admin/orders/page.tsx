'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Truck
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  orderNotes: string | null;
  subtotal: number;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  orderSource: string;
  paymentMethod: string;
  createdAt: string;
  orderItems: {
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
    };
  }[];
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today'); // New date filter state
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentNotes, setCurrentNotes] = useState("");
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [itemStatus, setItemStatus] = useState<{ [key: string]: boolean }>({});
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch Orders --------------------------------------------------------------------------------
  useEffect(() => {
    if (status === 'loading') return;

    if (
      status === 'unauthenticated' ||
      !(session?.user as any)?.role ||
      (session?.user as any)?.role !== 'admin'
    ) {
      router.push('/admin/login');
      return;
    }

    fetchOrders();
  }, [status, session, router]);

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

  // Update Order Status -------------------------------------------------------------------------
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, orderStatus: newStatus })
      });

      if (response.ok) fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  // Update Payment Status -----------------------------------------------------------------------
  const updatepaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    try {
      const response = await fetch('/api/admin/paymentStatus', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, paymentStatus: newPaymentStatus })
      });

      if (response.ok) fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  // Status Badge Colors -------------------------------------------------------------------------
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-purple-100 text-purple-800';
      case 'ready for pickup':
        return 'bg-teal-100 text-teal-800';
      case 'ready to serve':
        return 'bg-teal-100 text-teal-800';
      case 'out for delivery':
        return 'bg-indigo-100 text-indigo-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'unpaid':
        return 'bg-red-100 text-red-700';
      case 'to verify':
        return 'bg-yellow-100 text-yellow-700';
      case 'paid':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'gcash':
        return 'bg-purple-100 text-purple-700';
      case 'cod':
      case 'cash on delivery':
        return 'bg-gray-200 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'preparing':
        return <Package className="w-4 h-4" />;
      case 'read for pickup':
        return <Package className="w-4 h-4" />;
      case 'ready to serve':
        return <Package className="w-4 h-4" />;
      case 'mark as ready':
        return <Package className="w-4 h-4" />;
      case 'out for delivery':
        return <Truck className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <ShoppingBag className="w-4 h-4" />;
    }
  };

  // Date Filtering Helper ----------------------------------------------------------------------------
  const isOrderInDateRange = (orderDate: string) => {
    const order = new Date(orderDate);
    const now = new Date();
    
    // Reset time to start of day for accurate comparison
    order.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    if (dateFilter === 'today') {
      return order.getTime() === now.getTime();
    } else if (dateFilter === 'this week') {
      // Get start of current week (Sunday)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Get end of current week (Saturday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return order >= startOfWeek && order <= endOfWeek;
    } else if (dateFilter === 'this month') {
      return (
        order.getMonth() === now.getMonth() &&
        order.getFullYear() === now.getFullYear()
      );
    }
    
    return true; // Default: show all
  };

  // Filtering (Status + Date) -----------------------------------------------------------------------
  const filteredOrders = orders.filter((order) => {
    // Filter by status
    const matchesStatus =
      filter === 'all' || order?.orderStatus?.toLowerCase() === filter;
    
    // Filter by date range
    const matchesDate = isOrderInDateRange(order?.createdAt ?? '');
    
    return matchesStatus && matchesDate;
  });

  // Loading UI -----------------------------------------------------------------------------------
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Render UI ------------------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-amber-100 mb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/dashboard"
              className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-amber-900" />
            </Link>
            <h1 className="text-2xl font-bold text-amber-900">Manage Orders</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              'all',
              'pending',
              'confirmed',
              'preparing',
              'mark as ready',
              'out for delivery',
              'completed',
              'cancelled'
            ].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === status
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all'
                  ? 'All Orders'
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Date Filter Dropdown */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <label className="text-sm font-semibold text-gray-700">
              Date Range:
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <option value="today">Today</option>
              <option value="this week">This Week</option>
              <option value="this month">This Month</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium">
                {filter === 'all' && dateFilter === 'today'
                  ? 'No orders today'
                  : filter === 'all'
                  ? `No orders for ${dateFilter}`
                  : `No ${filter} orders for ${dateFilter}`}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Try adjusting your filters to see more results
              </p>
            </div>
          ) : (
            <>
              {/* ===================== */}
              {/* 🖥️ TABLE VIEW (SM+) */}
              {/* ===================== */}
              <div className="hidden sm:block overflow-x-auto bg-white rounded-xl shadow-md">
                <table className="min-w-full border-collapse">
                  <thead className="bg-amber-50 border-b">
                    <tr className="text-left text-sm font-semibold text-gray-700">
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-4">
                          <p className="font-bold">{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-sm">
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-xs">{order.customerEmail}</p>
                          <p className="text-xs">{order.customerPhone}</p>
                          <p className="text-xs truncate max-w-[220px]">
                            {order.deliveryAddress}
                          </p>
                        </td>

                        <td className="px-4 py-4 space-y-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                            order.orderStatus ?? ''
                          )}`}
                        >
                          {getStatusIcon(order.orderStatus ?? '')}
                          {order.orderStatus}
                        </span>

                        {order.orderSource === "KIOSK" ? (
                          <select
                            value={order.orderStatus}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="w-full px-2 py-1 border rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="mark as ready">Mark as Ready</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <select
                            value={order.orderStatus}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="w-full px-2 py-1 border rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="mark as ready">Mark as Ready</option>
                            <option value="out for delivery">Out for Delivery</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}
                      </td>

                        <td className="px-4 py-4 space-y-2">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(
                              order.paymentStatus ?? ''
                            )}`}
                          >
                            {order.paymentStatus}
                          </span>

                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getPaymentMethodColor(
                              order.paymentMethod ?? ''
                            )}`}
                          >
                            {order.paymentMethod}
                          </span>

                          <select
                            value={order.paymentStatus ?? ''}
                            onChange={(e) =>
                              updatepaymentStatus(order.id, e.target.value)
                            }
                            className="w-full px-2 py-1 border rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="to verify">To verify</option>
                            <option value="paid">Paid</option>
                          </select>
                        </td>

                        <td className="px-4 py-4 font-bold text-amber-600">
                          ₱{order.total?.toFixed(2)}
                        </td>

                        <td className="px-4 py-4">
                          <button
                            onClick={() => {
                              setSelectedItems(order.orderItems);
                              setSelectedOrderNumber(order.orderNumber);
                              setSelectedOrder(order);

                              const initialStatus: any = {};
                              order.orderItems.forEach((item: any) => {
                                initialStatus[item.id] = false;
                              });
                              setItemStatus(initialStatus);
                              setItemsModalOpen(true);
                            }}
                            className="px-3 py-2 bg-amber-600 text-white rounded-lg text-xs hover:bg-amber-700"
                          >
                            View Items
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ===================== */}
              {/* 📱 MOBILE VIEW (< SM) */}
              {/* ===================== */}
              <div className="sm:hidden space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl shadow-md p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <p className="font-bold text-amber-600">
                        ₱{order.total?.toFixed(2)}
                      </p>
                    </div>

                    <div className="text-sm">
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-xs">{order.customerPhone}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                          order.orderStatus ?? ''
                        )}`}
                      >
                        {order.orderStatus}
                      </span>

                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(
                          order.paymentStatus ?? ''
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>

                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getPaymentMethodColor(
                          order.paymentMethod ?? ''
                        )}`}
                      >
                        {order.paymentMethod}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedItems(order.orderItems);
                        setSelectedOrderNumber(order.orderNumber);
                        setSelectedOrder(order);
                        setItemsModalOpen(true);
                      }}
                      className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700"
                    >
                      View Items
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>



        {showNotesModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-3">Full Notes</h2>

              <p className="text-gray-800 whitespace-pre-wrap break-words">
                {currentNotes.split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    <br />
                  </span>
                ))}
              </p>

              <button
                onClick={() => setShowNotesModal(false)}
                className="mt-6 w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {itemsModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative max-h-[90vh] overflow-y-auto">
              
              <h2 className="text-xl font-semibold text-amber-800 mb-4">
                Order Items – {selectedOrderNumber}
              </h2>

              <div className="space-y-3">
                {selectedItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-lg text-sm"
                  >
                    <div>
                      <span className="text-gray-800 font-medium">
                        {item.product.name} × {item.quantity}
                      </span>
                      <p className="text-xs text-gray-600">
                        ₱ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* Checkbox */}
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={itemStatus[item.id] || false}
                        onChange={() =>
                          setItemStatus((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id],
                          }))
                        }
                        className="w-5 h-5"
                      />
                      <span className="text-xs font-medium">
                        {itemStatus[item.id] ? (
                          <span className="text-green-600">Done</span>
                        ) : (
                          <span className="text-orange-600">Preparing</span>
                        )}
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  if (!selectedOrder) return;

                  const printWindow = window.open("", "_blank");
                  if (!printWindow) return;

                  const totalPrice = selectedItems.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                  );

                  const itemsHTML = selectedItems
                    .map(
                      (item) => `
                      <tr>
                        <td>${item.product.name}</td>
                        <td style="text-align:center">${item.quantity}</td>
                        <td style="text-align:right">₱${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    `
                    )
                    .join("");

                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Receipt - ${selectedOrderNumber}</title>
                        <style>
                          @media print {
                            body { width: 80mm; margin: 0; font-family: monospace; }
                            table { width: 100%; border-collapse: collapse; }
                            th, td { padding: 2px 0; }
                            th { border-bottom: 1px dashed #000; }
                            td { border-bottom: 1px dashed #ccc; }
                            .total { font-weight: bold; text-align: right; margin-top: 4px; }
                            h2 { text-align: center; font-size: 16px; margin: 0 0 8px 0; }
                            p { margin: 2px 0; font-size: 12px; word-wrap: break-word; white-space: pre-wrap; }
                          }

                          body { width: 80mm; font-family: monospace; padding: 10px; }
                          h2 { text-align: center; font-size: 16px; margin-bottom: 10px; color: #b45309; }
                          table { width: 100%; margin-top: 8px; }
                          td { font-size: 12px; }
                          .total { font-weight: bold; margin-top: 6px; text-align: right; }
                          .section { margin-top: 6px; border-bottom: 1px dashed #000; padding-bottom: 4px; }
                        </style>
                      </head>
                      <body>
                        <h2>Receipt - ${selectedOrderNumber}</h2>

                        <div class="section">
                          <p><strong>Customer:</strong> ${selectedOrder.customerName}</p>
                          <p><strong>Email:</strong> ${selectedOrder.customerEmail}</p>
                          <p><strong>Phone:</strong> ${selectedOrder.customerPhone}</p>
                          <p><strong>Address:</strong> ${selectedOrder.deliveryAddress}</p>
                          <p><strong>Order Date:</strong> ${new Date(selectedOrder.createdAt).toLocaleString()}</p>
                          <p><strong>Order Status:</strong> ${selectedOrder.orderStatus}</p>
                          <p><strong>Payment Status:</strong> ${selectedOrder.paymentStatus}</p>
                          ${
                            selectedOrder.orderNotes
                              ? `<p style="white-space: pre-wrap; word-wrap: break-word;"><strong>Notes:</strong> ${selectedOrder.orderNotes}</p>`
                              : ""
                          }
                        </div>

                        <table>
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th style="text-align:center">Qty</th>
                              <th style="text-align:right">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${selectedItems
                              .map(
                                (item) => `
                              <tr>
                                <td>${item.product.name}</td>
                                <td style="text-align:center">${item.quantity}</td>
                                <td style="text-align:right">₱${(item.price * item.quantity).toFixed(2)}</td>
                              </tr>
                            `
                              )
                              .join("")}
                          </tbody>
                        </table>

                        <p class="total">Subtotal: ₱${selectedOrder.subtotal.toFixed(2)}</p>
                        <p class="total">Total: ₱${selectedOrder.total.toFixed(2)}</p>
                      </body>
                    </html>
                  `);

                  printWindow.document.close();
                  printWindow.focus();
                  printWindow.print();
                }}
                className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setItemsModalOpen(false)}
                className="mt-6 w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
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
