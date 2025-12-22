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
      case 'preparing':
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

  // Filtering ------------------------------------------------------------------------------------
  const filteredOrders =
    filter === 'all'
      ? orders
      : orders.filter((order) => order?.orderStatus?.toLowerCase() === filter);

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
          <div className="flex flex-wrap gap-2">
            {[
              'all',
              'pending',
              'confirmed',
              'preparing',
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
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">
                {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order?.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                  {/* Left Info Block */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {order?.orderNumber}
                      </h3>

                      <div className="flex flex-wrap gap-2 mb-2">
                        {/* Order Status */}
                        <span
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                            order?.orderStatus ?? ''
                          )}`}
                        >
                          {getStatusIcon(order?.orderStatus ?? '')}
                          <span>{order?.orderStatus}</span>
                        </span>

                        {/* Payment Status */}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(
                            order?.paymentStatus ?? ''
                          )}`}
                        >
                          {order?.paymentStatus}
                        </span>

                        {/* Payment Method */}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPaymentMethodColor(
                            order?.paymentMethod ?? ''
                          )}`}
                        >
                          {order?.paymentMethod}
                        </span>
                      </div>
                    </div>

                    {/* Order Info List */}
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-semibold">Customer:</span>{' '}
                        {order?.customerName}
                      </p>
                      <p>
                        <span className="font-semibold">Email:</span>{' '}
                        {order?.customerEmail}
                      </p>
                      <p>
                        <span className="font-semibold">Phone:</span>{' '}
                        {order?.customerPhone}
                      </p>
                      <p>
                        <span className="font-semibold">Address:</span>{' '}
                        {order?.deliveryAddress}
                      </p>

                      {order?.orderNotes && (
                        <div>
                          <span className="font-semibold">Notes:</span>{" "}
                          {order.orderNotes.length <= 30 ? (
                            <span>{order.orderNotes}</span>
                          ) : (
                            <span>
                              {order.orderNotes.slice(0, 30)}...
                              <button
                                onClick={() => {
                                  setCurrentNotes(order.orderNotes || "");
                                  setShowNotesModal(true);
                                }}
                                className="text-amber-600 underline ml-1 text-sm"
                              >
                                View All
                              </button>
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        Ordered:{' '}
                        {new Date(order?.createdAt ?? '').toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Right Status Update Column */}
                  <div className="lg:text-right">
                    <p className="text-2xl font-bold text-amber-600 mb-4">
                      ₱{order?.total?.toFixed(2)}
                    </p>

                    {/* Order Status Selector */}
                    <label className="text-sm font-medium">Order Status:</label>
                    <div className="space-y-2">
                      <select
                        value={order?.orderStatus}
                        onChange={(e) =>
                          updateOrderStatus(order?.id ?? '', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="out for delivery">
                          Out for Delivery
                        </option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Payment Status Selector */}
                    <label className="text-sm font-medium mt-4 block">
                      Payment Status:
                    </label>
                    <div className="space-y-2 mt-2">
                      <select
                        value={order?.paymentStatus ?? ''}
                        onChange={(e) =>
                          updatepaymentStatus(order?.id ?? '', e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="to verify">To verify</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => {
                      setSelectedItems(order.orderItems);
                      setSelectedOrderNumber(order.orderNumber);

                      // Save the whole order for printing
                      setSelectedOrder(order);

                      // Initialize item status
                      const initialStatus: any = {};
                      order.orderItems.forEach((item: any) => {
                        initialStatus[item.id] = false;
                      });
                      setItemStatus(initialStatus);

                      setItemsModalOpen(true);
                    }}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition"
                  >
                    View Items
                  </button>
                </div>
              </div>
            ))
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
