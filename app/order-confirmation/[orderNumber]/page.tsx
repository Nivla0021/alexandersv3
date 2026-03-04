// app/order-confirmation/[orderNumber]/page.tsx
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { prisma } from "@/lib/prisma";
import { CheckCircle, Clock, MapPin, Mail, Phone, Award, Tag, Package, ChevronRight, Info } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CopyOrderNumber from './CopyOrderNumber';
import { toast } from "sonner";

export const dynamic = 'force-dynamic';

// Define types for the order with discount details
interface DiscountDetails {
  type: string | null;
  totalDiscount: number;
  calculationMethod: string;
  appliedToItem: {
    id: string;
    name: string;
    originalPrice: number;
    quantity: number;
    discountAmount: number;
    discountedPrice: number;
    variantId?: string;
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

interface OrderWithDetails {
  id: string;
  orderNumber: string;
  transactionNumber: string | null;
  orderSource: string;
  orderMode: string | null;
  userId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  orderNotes: string | null;
  subtotal: number;
  total: number;
  deliveryFee: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryZipCode: string | null;
  locationData: string | null;
  gcashReference: string | null;
  discountApplied: boolean;
  discountType: string | null;
  discountAmount: number | null;
  discountApprovalId: string | null;
  discountDetails: DiscountDetails | null; // Add this
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string;
    email: string;
    phone: string | null;
  } | null;
  discountApproval: {
    discountType: string;
    status: string;
    reviewedAt: Date | null;
  } | null;
  orderItems: Array<{
    id: string;
    orderId: string;
    productId: string;
    variantId: string | null;
    variantLabel: string | null;
    quantity: number;
    price: number;
    discountApplied: boolean;
    discountAmount: number | null;
    discountedPrice: number | null;
    isHighestPriced: boolean;
    product: {
      id: string;
      name: string;
      image: string;
      category: string | null;
    };
  }>;
}

// ✅ Updated: params is now a Promise
interface PageProps {
  params: Promise<{
    orderNumber: string;
  }>;
}

async function getOrder(orderNumber: string): Promise<OrderWithDetails | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                category: true,
              }
            },
          },
        },
        discountApproval: {
          select: {
            discountType: true,
            status: true,
            reviewedAt: true,
          }
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        }
      },
    });

    if (!order) return null;

    // Cast to the expected type with discountDetails
    return order as OrderWithDetails;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

// Helper function to format discount type
function formatDiscountType(type: string | null): string {
  if (!type) return '';
  return type === 'PWD' ? 'PWD Discount' : 'Senior Citizen Discount';
}

// Helper function to calculate item total
function calculateItemTotal(price: number, quantity: number): number {
  return price * quantity;
}

// Helper function to check if item had discount
function hadDiscount(item: any): boolean {
  return item.discountApplied || false;
}

// ✅ Updated: await params
export default async function OrderConfirmationPage({ params }: PageProps) {
  // Await the params to get the orderNumber
  const { orderNumber } = await params;
  
  const order = await getOrder(orderNumber);

  if (!order) {
    notFound();
  }

  // Parse discountDetails if it exists
  const discountDetails = order.discountDetails ? 
    (typeof order.discountDetails === 'string' ? 
      JSON.parse(order.discountDetails) : 
      order.discountDetails) 
    : null;

  // Calculate original subtotal (before any discounts)
  const originalSubtotal = order.orderItems.reduce(
    (sum, item) => sum + (item.price * item.quantity), 
    0
  );

  // Calculate total savings
  const totalSavings = order.discountAmount || 0;

  // Determine payment method display
  const paymentMethodDisplay = order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'GCash';

  // Determine if order is from kiosk
  const isKioskOrder = order.orderSource === 'KIOSK';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-amber-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-lg text-gray-600">
              {isKioskOrder 
                ? 'Your order has been placed successfully.'
                : 'Thank you for your order. We\'ll start preparing it right away.'}
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Order Details
                </h2>

                <div className="space-y-3 text-gray-700">
                  {/* Order Number with Copy */}
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">Order Number:</span>
                    <span className="font-mono">{order.orderNumber}</span>
                    <CopyOrderNumber orderNumber={order.orderNumber} />
                  </p>

                  {/* Transaction Number (if available) */}
                  {order.transactionNumber && (
                    <p className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-semibold">Transaction #:</span>
                      <span className="font-mono">{order.transactionNumber}</span>
                    </p>
                  )}

                  {/* Order Source */}
                  <p>
                    <span className="font-semibold">Order Type:</span>{' '}
                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium capitalize">
                      {order.orderSource === 'ONLINE' ? 'Online Order' : 'Kiosk Order'}
                      {order.orderMode && ` (${order.orderMode.replace('-', ' ')})`}
                    </span>
                  </p>

                  {/* Status */}
                  <p>
                    <span className="font-semibold">Status:</span>{' '}
                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium capitalize">
                      {order.orderStatus === 'pending' ? 'Pending Confirmation' : order.orderStatus}
                    </span>
                  </p>

                  {/* Payment Method */}
                  <p>
                    <span className="font-semibold">Payment Method:</span>{' '}
                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                      {paymentMethodDisplay}
                    </span>
                  </p>

                  {/* Payment Status */}
                  <p>
                    <span className="font-semibold">Payment Status:</span>{' '}
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      order.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
                    </span>
                  </p>

                  {/* GCash Reference (if available) */}
                  {order.gcashReference && (
                    <p className="text-sm">
                      <span className="font-semibold">GCash Ref #:</span>{' '}
                      <span className="font-mono">{order.gcashReference}</span>
                    </p>
                  )}

                  {/* Estimated Delivery */}
                  {!isKioskOrder && (
                    <p className="flex items-start">
                      <Clock className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                      <span>
                        <span className="font-semibold">Estimated Delivery:</span> 1-2 hours
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  {isKioskOrder ? 'Order Information' : 'Customer Information'}
                </h2>
                
                {!isKioskOrder ? (
                  <div className="space-y-3 text-gray-700 text-sm">
                    <p className="flex items-start">
                      <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                      <span className="flex-1">{order.deliveryAddress}</span>
                    </p>
                    <p className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{order.customerEmail}</span>
                    </p>
                    <p className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{order.customerPhone}</span>
                    </p>
                    
                    {/* Delivery Zone Info */}
                    {order.deliveryZipCode && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Delivery Zone:</span>{' '}
                        {order.deliveryZipCode === '1602' 
                          ? 'Same Area (Pinagbuhatan)' 
                          : `ZIP: ${order.deliveryZipCode}`}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 text-gray-700">
                    <p className="text-sm">
                      <span className="font-semibold">Order prepared for:</span>{' '}
                      Walk-in Customer
                    </p>
                    {order.orderMode && (
                      <p className="text-sm">
                        <span className="font-semibold">Service Type:</span>{' '}
                        {order.orderMode.replace('-', ' ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Discount Information Banner */}
            {order.discountApplied && discountDetails && (
              <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <Award className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-green-800 mb-2">
                      {formatDiscountType(order.discountType)} Applied
                    </h3>
                    
                    {/* Discount Breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Original Subtotal:</span>
                        <span className="font-medium">₱{originalSubtotal.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="font-medium">Discount ({order.discountType} 20%):</span>
                        <span>-₱{totalSavings.toFixed(2)}</span>
                      </div>

                      {discountDetails.appliedToItem && (
                        <div className="mt-3 p-3 bg-green-100/50 rounded-lg">
                          <p className="text-xs text-green-700 font-medium mb-1">
                            Discount applied to highest-priced item:
                          </p>
                          <p className="text-sm text-green-800">
                            {discountDetails.appliedToItem.name}
                          </p>
                          <div className="flex justify-between text-xs text-green-600 mt-1">
                            <span>Original: ₱{discountDetails.appliedToItem.originalPrice.toFixed(2)}</span>
                            <ChevronRight className="w-3 h-3" />
                            <span>Discounted: ₱{discountDetails.appliedToItem.discountedPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-amber-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.orderItems?.map((item: any) => {
                  const itemTotal = calculateItemTotal(item.price, item.quantity);
                  const hasDiscount = item.discountApplied || false;
                  const itemDiscountAmount = item.discountAmount || 0;
                  const discountedTotal = hasDiscount && itemDiscountAmount > 0
                    ? itemTotal - itemDiscountAmount
                    : itemTotal;
                  
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border ${
                        hasDiscount 
                          ? 'border-green-200 bg-green-50/50' 
                          : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800">
                              {item.product?.name}
                            </p>
                            {hasDiscount && (
                              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                                20% OFF
                              </span>
                            )}
                          </div>

                          {item.variantLabel && (
                            <p className="text-sm text-gray-500">
                              Variant: {item.variantLabel}
                            </p>
                          )}
                          
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-600">
                              Price per item: ₱{item.price.toFixed(2)} × {item.quantity}
                            </p>
                            
                            {/* Item price breakdown */}
                            {hasDiscount && itemDiscountAmount > 0 ? (
                              <div className="text-sm">
                                <div className="flex justify-between text-gray-600">
                                  <span>Subtotal:</span>
                                  <span>₱{itemTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                  <span>Discount:</span>
                                  <span>-₱{itemDiscountAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-medium mt-1 pt-1 border-t border-green-200">
                                  <span>Final:</span>
                                  <span className="text-green-700">₱{discountedTotal.toFixed(2)}</span>
                                </div>
                              </div>
                            ) : (
                              <p className="font-medium text-amber-900">
                                Total: ₱{itemTotal.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-6">
              <h3 className="font-bold text-lg text-gray-800 mb-3">Order Summary</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₱{originalSubtotal.toFixed(2)}</span>
                </div>
                
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span>₱{order.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                
                {order.discountApplied && order.discountAmount && order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="font-medium">Discount ({order.discountType} 20%):</span>
                    <span>-₱{order.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold pt-3 mt-3 border-t">
                  <span>Total:</span>
                  <span className="text-amber-900">₱{order.total.toFixed(2)}</span>
                </div>

                {order.discountApplied && order.discountAmount && order.discountAmount > 0 && (
                  <p className="text-xs text-green-600 text-right mt-2">
                    You saved ₱{order.discountAmount.toFixed(2)} on this order!
                  </p>
                )}
              </div>
            </div>

            {/* Order Notes (if any) */}
            {order.orderNotes && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Order Notes:</span><br />
                  {order.orderNotes}
                </p>
              </div>
            )}
          </div>

          {/* Payment Instructions */}
          <div className="bg-amber-50 rounded-xl shadow-md p-8 mb-8">
            
            {order.paymentMethod === 'GCASH' ? (
              <div className="space-y-4">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Note:</span> Your order will be processed once payment is verified. You can also view your order details in your profile..
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-700">
                  Your order has been confirmed and will be prepared for delivery.
                </p>
                <div className="bg-white p-4 rounded-lg">
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>Please prepare the exact amount of <span className="font-bold text-green-700">₱{order.total.toFixed(2)}</span></li>
                    <li>Our delivery rider will contact you upon arrival</li>
                    <li>You can track your order status in your profile</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/menu"
              className="px-8 py-4 bg-amber-600 text-white text-center rounded-lg hover:bg-amber-700 transition-colors font-semibold"
            >
              Order More
            </Link>
            <Link
              href="/orders"
              className="px-8 py-4 bg-white text-amber-900 text-center rounded-lg hover:bg-amber-50 transition-colors font-semibold border-2 border-amber-600"
            >
              My orders
            </Link>
            <Link
              href="/"
              className="px-8 py-4 bg-gray-100 text-gray-700 text-center rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}