// app/store-manager/gcash-orders/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin-header';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  ArrowLeft,
  Award,
  Percent,
  ChevronRight,
  Info,
  Package,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface DiscountDetails {
  type: string;
  totalDiscount: number;
  calculationMethod: string;
  appliedToItem: {
    id: string;
    name: string;
    originalPrice: number;
    quantity: number;
    discountAmount: number;
    discountedPrice: number;
    variantLabel?: string;
  };
  itemsConsidered: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    variantLabel?: string;
  }>;
  discountApprovalId?: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  variantLabel: string | null;
  discountApplied: boolean;
  discountAmount: number | null;
  discountedPrice: number | null;
  isHighestPriced: boolean;
  product: {
    id: string;
    name: string;
    image?: string;
    category?: string;
  };
}

interface GCashOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryZipCode?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  gcashReference: string | null;
  gcashReceiptUrl: string | null;
  createdAt: string;
  orderNotes?: string;
  orderItems: OrderItem[];
  
  // Discount fields
  discountApplied: boolean;
  discountType: string | null;
  discountAmount: number | null;
  discountDetails: DiscountDetails | null;
  
  // Approval info
  discountApproval?: {
    id: string;
    discountType: string;
    status: string;
    reviewedAt: string | null;
  } | null;
}

export default function GCashOrdersPage() {
  const [orders, setOrders] = useState<GCashOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<GCashOrder | null>(null);
  const [filter, setFilter] = useState('all');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [selectedReference, setSelectedReference] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    fetchOrders();
  }, [filter]);
  
  const fetchOrders = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/admin/orders/gcash'
        : `/api/admin/orders/gcash?status=${filter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      console.log(data);
      setOrders(data);
    } catch (error) {
      console.error('Error fetching GCash orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (orderId: string) => {
    if (!confirm('Mark this payment as verified and complete the order?')) return;
    
    setProcessingOrderId(orderId);
    try {
      const response = await fetch('/api/admin/orders/verify-gcash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      
      if (response.ok) {
        alert('Payment verified! Order marked as paid.');
        fetchOrders();
        setSelectedOrder(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to verify payment');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Failed to verify payment');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const rejectPayment = async () => {
    if (!rejectReason.trim()) {
      alert('Please enter a reason for rejection');
      return;
    }
    
    setProcessingOrderId(selectedOrder?.id || null);
    try {
      const response = await fetch('/api/admin/orders/reject-gcash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: selectedOrder?.id, 
          reason: rejectReason 
        }),
      });
      
      if (response.ok) {
        alert('Payment rejected! Customer notified.');
        fetchOrders();
        setSelectedOrder(null);
        setShowRejectModal(false);
        setRejectReason('');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject payment');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Failed to reject payment');
    } finally {
      setProcessingOrderId(null);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unpaid':
      case 'awaiting_payment':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Awaiting Payment
          </span>
        );
      case 'verifying':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CreditCard className="w-3 h-3 mr-1" />
            Verifying
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </span>
        );
      case 'failed':
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const formatDiscountType = (type: string | null): string => {
    if (!type) return '';
    return type === 'PWD' ? 'PWD Discount' : 'Senior Citizen Discount';
  };

  const calculateItemTotal = (price: number, quantity: number): number => {
    return price * quantity;
  };

  const downloadReceipt = (url: string, orderNumber: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `gcash-receipt-${orderNumber}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <AdminHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading GCash orders...</p>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
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
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-900 mb-2">GCash Payment Verification</h1>
          <p className="text-gray-600">Verify and confirm GCash payments from customers</p>
        </div>
        
        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2 border-b border-gray-200">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium ${
                filter === 'all'
                  ? 'text-amber-600 border-b-2 border-amber-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All GCash Orders
            </button>
            <button
              onClick={() => setFilter('verifying')}
              className={`px-4 py-2 text-sm font-medium ${
                filter === 'verifying'
                  ? 'text-amber-600 border-b-2 border-amber-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Needs Verification
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 text-sm font-medium ${
                filter === 'paid'
                  ? 'text-amber-600 border-b-2 border-amber-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Verified & Paid
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 text-sm font-medium ${
                filter === 'failed'
                  ? 'text-amber-600 border-b-2 border-amber-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>
        
        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{order.customerName}</p>
                        <p className="text-sm text-gray-500">{order.customerPhone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        {order.gcashReference && (
                          <button
                            onClick={() => setSelectedReference(order.gcashReference)}
                            className="group inline-flex items-center px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          >
                            <span className="text-xs font-mono font-medium text-blue-700 group-hover:text-blue-900">
                              Ref: {order.gcashReference}
                            </span>
                            <ExternalLink className="w-3 h-3 ml-1 text-blue-500 group-hover:text-blue-700" />
                          </button>
                        )}
                        {order.gcashReceiptUrl && (
                          <button
                            onClick={() => setSelectedReceipt(order.gcashReceiptUrl)}
                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 mt-2"
                          >
                            <ImageIcon className="w-3 h-3 mr-1" />
                            View Receipt
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">₱{order.total.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        Items: ₱{order.subtotal.toFixed(2)} + Delivery: ₱{order.deliveryFee.toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {order.discountApplied ? (
                        <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          {order.discountType} (₱{(order.discountAmount || 0).toFixed(2)})
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No discount</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.paymentStatus)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                        {order.paymentStatus === 'verifying' && (
                          <>
                            <button
                              onClick={() => verifyPayment(order.id)}
                              disabled={processingOrderId === order.id}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Verify
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowRejectModal(true);
                              }}
                              disabled={processingOrderId === order.id}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {orders.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No GCash orders found</h3>
                <p className="text-gray-500">
                  {filter === 'all' 
                    ? 'No GCash orders have been placed yet.' 
                    : `No orders with status "${filter}" found.`}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order #{selectedOrder.orderNumber}
                  </h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Info className="w-4 h-4 mr-2" />
                      Customer Information
                    </h3>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-700">{selectedOrder.customerEmail}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-700">{selectedOrder.customerPhone}</span>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-1" />
                        <span className="text-gray-700">{selectedOrder.deliveryAddress}</span>
                      </div>
                      {selectedOrder.deliveryZipCode && (
                        <div className="flex items-center">
                          <Package className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-700">ZIP: {selectedOrder.deliveryZipCode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Payment Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Payment Information
                    </h3>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        {getStatusBadge(selectedOrder.paymentStatus)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Method:</span>
                        <span className="font-medium">GCash</span>
                      </div>
                      {selectedOrder.gcashReference && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Reference:</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedReference(selectedOrder.gcashReference)}
                              className="font-mono font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                            >
                              {selectedOrder.gcashReference}
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </button>
                            <button
                              onClick={() => copyToClipboard(selectedOrder.gcashReference!)}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Copy to clipboard"
                            >
                              {copied ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Date:</span>
                        <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Receipt Section */}
                    {selectedOrder.gcashReceiptUrl && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Payment Receipt
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="relative group">
                            <img
                              src={selectedOrder.gcashReceiptUrl}
                              alt="GCash Payment Receipt"
                              className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setSelectedReceipt(selectedOrder.gcashReceiptUrl)}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <button
                                onClick={() => setSelectedReceipt(selectedOrder.gcashReceiptUrl)}
                                className="bg-white text-gray-900 px-3 py-1.5 rounded-lg text-sm font-medium mr-2"
                              >
                                <ExternalLink className="w-4 h-4 inline mr-1" />
                                View
                              </button>
                              <button
                                onClick={() => downloadReceipt(selectedOrder.gcashReceiptUrl!, selectedOrder.orderNumber)}
                                className="bg-white text-gray-900 px-3 py-1.5 rounded-lg text-sm font-medium"
                              >
                                <Download className="w-4 h-4 inline mr-1" />
                                Download
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Click image to view full size
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Notes */}
                {selectedOrder.orderNotes && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Order Notes</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{selectedOrder.orderNotes}</p>
                    </div>
                  </div>
                )}

                {/* Discount Information */}
                {selectedOrder.discountApplied && selectedOrder.discountDetails && (
                  <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5">
                    <div className="flex items-start gap-3">
                      <Award className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-bold text-green-800 mb-2">
                          {formatDiscountType(selectedOrder.discountType)} Applied
                        </h3>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Original Subtotal:</span>
                            <span className="font-medium">₱{selectedOrder.subtotal.toFixed(2)}</span>
                          </div>
                          
                          <div className="flex justify-between text-sm text-green-600">
                            <span className="font-medium">Discount (20%):</span>
                            <span>-₱{(selectedOrder.discountAmount || 0).toFixed(2)}</span>
                          </div>

                          {selectedOrder.discountDetails.appliedToItem && (
                            <div className="mt-3 p-3 bg-green-100/50 rounded-lg">
                              <p className="text-xs text-green-700 font-medium mb-1">
                                Discount applied to highest-priced item:
                              </p>
                              <p className="text-sm text-green-800">
                                {selectedOrder.discountDetails.appliedToItem.name}
                                {selectedOrder.discountDetails.appliedToItem.variantLabel && 
                                  ` (${selectedOrder.discountDetails.appliedToItem.variantLabel})`
                                }
                              </p>
                              <div className="flex justify-between text-xs text-green-600 mt-1">
                                <span>Original: ₱{selectedOrder.discountDetails.appliedToItem.originalPrice.toFixed(2)}</span>
                                <ChevronRight className="w-3 h-3" />
                                <span>Discounted: ₱{selectedOrder.discountDetails.appliedToItem.discountedPrice.toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Order Items */}
                <div className="mt-8">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                  <div className="border rounded-lg divide-y">
                    {selectedOrder.orderItems.map((item, index) => {
                      const itemTotal = calculateItemTotal(item.price, item.quantity);
                      const hasDiscount = item.discountApplied;
                      const discountedTotal = hasDiscount && item.discountedPrice ? item.discountedPrice : itemTotal;
                      
                      return (
                        <div key={index} className={`p-4 ${hasDiscount ? 'bg-green-50' : ''}`}>
                          <div className="flex justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{item.product.name}</p>
                                {hasDiscount && (
                                  <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                                    20% OFF
                                  </span>
                                )}
                              </div>
                              {item.variantLabel && (
                                <p className="text-sm text-gray-500">Variant: {item.variantLabel}</p>
                              )}
                              {hasDiscount && item.discountAmount && item.discountAmount > 0 && (
                                <p className="text-xs text-green-600 mt-1">
                                  Discount: -₱{item.discountAmount.toFixed(2)}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${hasDiscount ? 'text-green-600' : ''}`}>
                                ₱{hasDiscount ? discountedTotal.toFixed(2) : itemTotal.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-500">{item.quantity} × ₱{item.price.toFixed(2)}</p>
                              {hasDiscount && (
                                <p className="text-xs text-gray-400 line-through">
                                  ₱{itemTotal.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Order Summary */}
                    <div className="p-4 bg-gray-50">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Subtotal</span>
                        <span>₱{selectedOrder.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Delivery Fee</span>
                        <span>₱{selectedOrder.deliveryFee.toFixed(2)}</span>
                      </div>
                      {selectedOrder.discountApplied && selectedOrder.discountAmount && selectedOrder.discountAmount > 0 && (
                        <div className="flex justify-between text-sm mb-2 text-green-600">
                          <span>Discount ({selectedOrder.discountType} 20%)</span>
                          <span>-₱{selectedOrder.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span className="text-green-700">₱{selectedOrder.total.toFixed(2)}</span>
                      </div>
                      {selectedOrder.discountApplied && selectedOrder.discountAmount && selectedOrder.discountAmount > 0 && (
                        <p className="text-xs text-green-600 text-right mt-1">
                          Customer saved ₱{selectedOrder.discountAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                {selectedOrder.paymentStatus === 'verifying' && (
                  <div className="mt-8 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={processingOrderId === selectedOrder.id}
                      className="px-6 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-medium disabled:opacity-50"
                    >
                      Reject Payment
                    </button>
                    <button
                      onClick={() => verifyPayment(selectedOrder.id)}
                      disabled={processingOrderId === selectedOrder.id}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                    >
                      {processingOrderId === selectedOrder.id ? (
                        <>
                          <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          Processing...
                        </>
                      ) : (
                        '✓ Verify Payment'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reference Number Modal */}
        {selectedReference && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[70]"
            onClick={() => setSelectedReference(null)}
          >
            <div className="relative max-w-2xl w-full">
              <button
                onClick={() => setSelectedReference(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                <XCircle className="w-8 h-8" />
              </button>
              <div 
                className="bg-white rounded-xl p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-gray-700 mb-4">GCash Reference Number</h3>
                <div className="bg-gray-100 rounded-lg p-6 mb-6">
                  <p className="text-4xl font-mono font-bold text-center text-gray-900 break-all">
                    {selectedReference}
                  </p>
                </div>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => copyToClipboard(selectedReference)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Number
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedReference(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Image Modal */}
        {selectedReceipt && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[70]"
            onClick={() => setSelectedReceipt(null)}
          >
            <div className="relative max-w-4xl w-full max-h-[90vh]">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                <XCircle className="w-8 h-8" />
              </button>
              <img
                src={selectedReceipt}
                alt="GCash Receipt"
                className="w-full h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => {
                  if (selectedOrder) {
                    downloadReceipt(selectedReceipt, selectedOrder.orderNumber);
                  }
                }}
                className="absolute bottom-4 right-4 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                <Download className="w-5 h-5 inline mr-2" />
                Download
              </button>
            </div>
          </div>
        )}

        {/* Reject Payment Modal */}
        {showRejectModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Payment</h3>
                <p className="text-gray-600 mb-4">
                  Please provide a reason for rejecting this payment. The customer will be notified.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., Payment amount incorrect, Invalid reference number, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                  rows={4}
                />
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={rejectPayment}
                    disabled={!rejectReason.trim() || processingOrderId === selectedOrder.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {processingOrderId === selectedOrder.id ? 'Processing...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}