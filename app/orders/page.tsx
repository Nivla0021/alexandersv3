'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Package, Clock, CheckCircle, XCircle, Truck, CreditCard, ArrowLeft, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    image: string;
    price: number;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  orderItems: OrderItem[];
}

export default function OrdersPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/orders');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchOrders();
    }
  }, [session]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/customer');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'unpaid':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'to verify':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'confirmed':
      case 'preparing':
        return <Package className="w-5 h-5" />;
      case 'out_for_delivery':
        return <Truck className="w-5 h-5" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
      case 'failed':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 py-12">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center text-amber-700 hover:text-amber-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-6">
              <h1 className="text-3xl font-bold text-white mb-2">My Orders</h1>
              <p className="text-amber-100">Track and manage your orders</p>
            </div>

            <div className="p-8">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No orders yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Start ordering delicious Filipino food!
                  </p>
                  <Link href="/menu">
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                      Browse Menu
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-amber-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                    >
                      {/* Order Header */}
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            Order #{order.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${
                              getStatusColor(order.orderStatus)
                            }`}
                          >
                            {getStatusIcon(order.orderStatus)}
                            {formatStatus(order.orderStatus)}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${
                              getPaymentStatusColor(order.paymentStatus)
                            }`}
                          >
                            <CreditCard className="w-4 h-4" />
                            {formatStatus(order.paymentStatus)}
                          </span>
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">
                          {order.orderItems.length} item(s)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {order.orderItems.slice(0, 3).map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-lg"
                            >
                              <span className="text-xs font-medium text-amber-900">
                                {item.quantity}x {item.product.name}
                              </span>
                            </div>
                          ))}
                          {order.orderItems.length > 3 && (
                            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg">
                              <span className="text-xs font-medium text-gray-600">
                                +{order.orderItems.length - 3} more
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-amber-100">
                        <div>
                          <p className="text-sm text-gray-600">Total Amount</p>
                          <p className="text-2xl font-bold text-amber-600">
                            ₱{order.total.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Payment: {order.paymentMethod}
                          </p>
                        </div>
                        <Button
                          onClick={() => setSelectedOrder(order)}
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Order #{selectedOrder.orderNumber}
                </h2>
                <p className="text-amber-100">
                  {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-white hover:text-amber-100 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Status Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Order Status
                </h3>
                <div className="flex flex-wrap gap-3">
                  <span
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border flex items-center gap-2 ${
                      getStatusColor(selectedOrder.orderStatus)
                    }`}
                  >
                    {getStatusIcon(selectedOrder.orderStatus)}
                    {formatStatus(selectedOrder.orderStatus)}
                  </span>
                  <span
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border flex items-center gap-2 ${
                      getPaymentStatusColor(selectedOrder.paymentStatus)
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    {formatStatus(selectedOrder.paymentStatus)}
                  </span>
                </div>
              </div>

              {/* Customer Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Delivery Information
                </h3>
                <div className="bg-amber-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-700">Name:</span>{' '}
                    <span className="text-gray-900">{selectedOrder.customerName}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold text-gray-700">Email:</span>{' '}
                    <span className="text-gray-900">{selectedOrder.customerEmail}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold text-gray-700">Phone:</span>{' '}
                    <span className="text-gray-900">{selectedOrder.customerPhone}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold text-gray-700">Address:</span>{' '}
                    <span className="text-gray-900">{selectedOrder.deliveryAddress}</span>
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Order Items
                </h3>
                <div className="space-y-3">
                  {selectedOrder.orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 bg-gray-50 rounded-lg p-4"
                    >
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-amber-600">
                          ₱{(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          ₱{item.price.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-amber-200 pt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedOrder.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-amber-600">
                    ₱{selectedOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-4">
                <Button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
