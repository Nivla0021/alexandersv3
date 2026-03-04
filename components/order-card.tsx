// components/order-card.tsx
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Award, Percent, ChevronRight, Info, Truck } from 'lucide-react';
import { OrderPayload } from '@/types/order';

// Extend the OrderItem type locally to include variantLabel
interface ExtendedOrderItem {
  id: string;
  quantity: number;
  price: number;
  variantLabel?: string | null;
  discountApplied?: boolean;
  discountedPrice?: number | null;
  product: {
    name: string;
  };
}

// Extend OrderPayload to include all the fields used in the component
interface ExtendedOrderPayload extends Omit<OrderPayload, 'orderItems'> {
  orderItems: ExtendedOrderItem[];
  discountApplied?: boolean;
  discountType?: string | null;
  discountAmount?: number | null;
  discountDetails?: any;
  deliveryFee?: number;
}

interface OrderCardProps {
  order: ExtendedOrderPayload;
  showCancel?: boolean;
  setSelectedNotes?: (notes: string | null) => void;
  updateOrderStatus?: (id: string, status: string) => void;
  getNextStatuses?: (order: ExtendedOrderPayload) => string[];
  getModeColor?: (mode: string) => string;
  getStatusColor?: (status: string) => string;
  formatPhp?: (value: number) => string;
}

interface DiscountedItemInfo {
  id: string;
  name: string;
  originalPrice: number;
  quantity: number;
  discountAmount: number;
  discountedPrice: number;
  variantLabel?: string;
}

// Helper function to safely get delivery fee
const getDeliveryFee = (order: ExtendedOrderPayload): number => {
  return order.deliveryFee || 0;
};

export function OrderCard({ 
  order,
  showCancel = false,
  updateOrderStatus,
  getNextStatuses,
  getModeColor,
  getStatusColor,
  formatPhp,
}: OrderCardProps) {

  // State for payment modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [givenAmount, setGivenAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [change, setChange] = useState<number>(0);
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrderPayload | null>(null)
  const [showModal, setShowModal] = useState(false);
  
  // New state for KIOSK discount
  const [discountEligible, setDiscountEligible] = useState(false);
  const [discountType, setDiscountType] = useState<'PWD' | 'SENIOR' | null>(null);
  const [kioskDiscountAmount, setKioskDiscountAmount] = useState(0);
  const [kioskDiscountedItem, setKioskDiscountedItem] = useState<DiscountedItemInfo | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [onlineReceiptLoading, setOnlineReceiptLoading] = useState(false);

  // Determine if order is from KIOSK
  const isKioskOrder = order.orderSource === 'KIOSK';
  
  // Safely get delivery fee
  const orderDeliveryFee = getDeliveryFee(order);
  const effectiveDeliveryFee = isKioskOrder ? 0 : orderDeliveryFee;

  // Calculate discount for KIOSK orders when eligibility is selected
  useEffect(() => {
    if (isKioskOrder && discountEligible && discountType) {
      // Find the highest priced item
      const items = order.orderItems;
      if (items.length === 0) return;

      const highestPriceItem = items.reduce((max, item) => 
        item.price > max.price ? item : max
      , items[0]);
      
      const discountAmount = highestPriceItem.price * 0.2;
      
      setKioskDiscountedItem({
        id: highestPriceItem.id,
        name: highestPriceItem.product.name,
        originalPrice: highestPriceItem.price,
        quantity: 1,
        discountAmount: discountAmount,
        discountedPrice: highestPriceItem.price - discountAmount,
        variantLabel: highestPriceItem.variantLabel || undefined,
      });
      
      setKioskDiscountAmount(discountAmount);
    } else {
      setKioskDiscountedItem(null);
      setKioskDiscountAmount(0);
    }
  }, [discountEligible, discountType, order.orderItems, isKioskOrder]);

  const showDetailsModal = (order: ExtendedOrderPayload) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeOnlineModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  // Show modal function
  const showPaymentModal = (orderId: string) => {
    if (order.id === orderId) {
      // Reset discount states when opening modal
      setDiscountEligible(false);
      setDiscountType(null);
      setKioskDiscountAmount(0);
      setKioskDiscountedItem(null);
      setGivenAmount('');
      setError('');
      setChange(0);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => setIsModalOpen(false);

  // Recalculate total to ensure delivery fee is correct for KIOSK orders
  const calculatedItemsTotal = order.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Calculate total with KIOSK discount if applicable
  const getTotal = () => {
    if (isKioskOrder) {
      const baseTotal = order.total || calculatedItemsTotal;
      if (discountEligible && discountType && kioskDiscountAmount > 0) {
        return baseTotal - kioskDiscountAmount;
      }
      return baseTotal;
    }
    return order.total ?? calculatedItemsTotal + effectiveDeliveryFee;
  };

  const total = getTotal();
  
  // Calculate original subtotal (before discount)
  const originalSubtotal = order.orderItems.reduce(
    (sum, item) => sum + (item.price * item.quantity), 
    0
  );
  
  // Check if order has discount (existing or new KIOSK discount)
  const hasDiscount = (order.discountApplied || false) || (isKioskOrder && discountEligible && discountType && kioskDiscountAmount > 0);
  const displayDiscountAmount = isKioskOrder && discountEligible ? kioskDiscountAmount : (order.discountAmount || 0);
  const displayDiscountType = isKioskOrder && discountEligible ? discountType : order.discountType;
  const displayDiscountDetails = isKioskOrder && discountEligible && kioskDiscountedItem ? {
    appliedToItem: kioskDiscountedItem
  } : order.discountDetails;
  
  // Check if order has delivery fee (only for ONLINE orders and fee > 0)
  const hasDeliveryFee = !isKioskOrder && effectiveDeliveryFee > 0;

  const printReceipt = async (order: ExtendedOrderPayload, given: number, change: number) => {
    setReceiptLoading(true);
    
    // Simulate API/database call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const total = getTotal();

    // Determine which items have discount for receipt display
    const receiptItems = order.orderItems.map(item => {
      const itemHasDiscount = isKioskOrder && discountEligible && kioskDiscountedItem?.id === item.id;
      const itemTotal = item.price * item.quantity;
      const discountedTotal = itemHasDiscount && kioskDiscountedItem 
        ? itemTotal - kioskDiscountedItem.discountAmount 
        : itemTotal;
      
      return {
        ...item,
        displayHasDiscount: itemHasDiscount,
        displayDiscountedTotal: discountedTotal,
        displayDiscountAmount: itemHasDiscount ? kioskDiscountedItem?.discountAmount : 0,
      };
    });

    const receiptHTML = `
      <html>
        <head>
          <style>
            body {
              font-family: monospace;
              width: 280px;
              margin: 0 auto;
              padding: 10px;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed #000; margin: 6px 0; }
            .items { margin-top: 8px; }
            .item-row { display: flex; justify-content: space-between; }
            .totals { margin-top: 8px; font-weight: bold; }
            .discount-badge { background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; display: inline-block; margin-left: 4px; }
            .strike { text-decoration: line-through; color: #999; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="center bold">Alexander's</div>
          <div class="center">Customer Receipt</div>
          <div class="line"></div>

          <div><strong>Order #:</strong> ${order.orderNumber}</div>
          ${
            order.transactionNumber
              ? `<div><strong>TXN:</strong> ${order.transactionNumber}</div>`
              : ""
          }
          <div><strong>Mode:</strong> ${order.orderSource}</div>

          <div class="line"></div>

          <div class="items">
            ${receiptItems
              .map(
                (item) => {
                  const itemTotal = item.quantity * item.price;
                  const itemHasDiscount = item.displayHasDiscount;
                  const discountedTotal = itemHasDiscount ? item.displayDiscountedTotal : itemTotal;
                  
                  return `
                    <div class="item-row">
                      <span>
                        ${item.quantity} x ${item.product.name} ${
                          item.variantLabel ? `(${item.variantLabel})` : ""
                        }
                        ${itemHasDiscount ? '<span class="discount-badge">20% OFF</span>' : ''}
                      </span>
                      <span>
                        ${itemHasDiscount ? `<span class="strike">₱${itemTotal.toFixed(2)}</span> ` : ''}
                        ₱${discountedTotal.toFixed(2)}
                      </span>
                    </div>
                  `;
                }
              )
              .join("")}
          </div>

          <div class="line"></div>

          ${hasDiscount ? `
            <div class="item-row"><span>Subtotal:</span><span>₱${originalSubtotal.toFixed(2)}</span></div>
            <div class="item-row" style="color: #10b981;"><span>Discount (${displayDiscountType} 20%):</span><span>-₱${displayDiscountAmount.toFixed(2)}</span></div>
          ` : ''}

          ${hasDeliveryFee ? `
            <div class="item-row"><span>Delivery Fee:</span><span>₱${effectiveDeliveryFee.toFixed(2)}</span></div>
          ` : ''}

          <div class="totals">
            <div class="item-row"><span>Total:</span><span>₱${total.toFixed(2)}</span></div>
            <div class="item-row"><span>Cash:</span><span>₱${given.toFixed(2)}</span></div>
            <div class="item-row"><span>Change:</span><span>₱${change.toFixed(2)}</span></div>
          </div>

          <div class="line"></div>

          <div class="center">${new Date().toLocaleString()}</div>
          <div class="center">Thank you for your purchase!</div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `;

    const win = window.open("", "width=300,height=600");
    win?.document.write(receiptHTML);
    win?.document.close();
    
    setReceiptLoading(false);
  };


  const printOnlineReceipt = async (order: ExtendedOrderPayload) => {
    setOnlineReceiptLoading(true);
    
    // Simulate API/database call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const total = order.total ?? order.subtotal ?? 0;

    const receiptHTML = `
      <html>
        <head>
          <style>
            body {
              font-family: monospace;
              width: 280px;
              margin: 0 auto;
              padding: 10px;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed #000; margin: 6px 0; }
            .items { margin-top: 8px; }
            .item-row { display: flex; justify-content: space-between; }
            .totals { margin-top: 8px; font-weight: bold; }
            .discount-badge { background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; display: inline-block; margin-left: 4px; }
            .strike { text-decoration: line-through; color: #999; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="center bold">Alexander's</div>
          <div class="center">Delivery Receipt</div>
          <div class="line"></div>

          <div><strong>Order #:</strong> ${order.orderNumber}</div>
          ${
            order.transactionNumber
              ? `<div><strong>TXN:</strong> ${order.transactionNumber}</div>`
              : ""
          }
          <div><strong>Payment:</strong> ${order.paymentMethod}</div>
          <div><strong>Status:</strong> ${order.paymentStatus}</div>

          <div class="line"></div>

          <div><strong>Name:</strong> ${order.customerName ?? "N/A"}</div>
          <div><strong>Email:</strong> ${order.customerEmail ?? "N/A"}</div>
          <div><strong>Phone:</strong> ${order.customerPhone ?? "N/A"}</div>
          <div><strong>Address:</strong> ${order.deliveryAddress ?? "N/A"}</div>

          <div class="line"></div>

          <div class="items">
            ${order.orderItems
              .map(
                (item) => {
                  const itemTotal = item.quantity * item.price;
                  const itemHasDiscount = item.discountApplied;
                  const discountedTotal = itemHasDiscount && item.discountedPrice ? item.discountedPrice : itemTotal;
                  
                  return `
                    <div class="item-row">
                      <span>
                        ${item.quantity} x ${item.product.name} ${
                          item.variantLabel ? `(${item.variantLabel})` : ""
                        }
                        ${itemHasDiscount ? '<span class="discount-badge">20% OFF</span>' : ''}
                      </span>
                      <span>
                        ${itemHasDiscount ? `<span class="strike">₱${itemTotal.toFixed(2)}</span> ` : ''}
                        ₱${discountedTotal.toFixed(2)}
                      </span>
                    </div>
                  `;
                }
              )
              .join("")}
          </div>

          <div class="line"></div>

          ${order.discountApplied ? `
            <div class="item-row"><span>Subtotal:</span><span>₱${originalSubtotal.toFixed(2)}</span></div>
            <div class="item-row" style="color: #10b981;"><span>Discount (${order.discountType} 20%):</span><span>-₱${(order.discountAmount || 0).toFixed(2)}</span></div>
          ` : ''}

          ${hasDeliveryFee ? `
            <div class="item-row"><span>Delivery Fee:</span><span>₱${effectiveDeliveryFee.toFixed(2)}</span></div>
          ` : ''}

          <div class="totals">
            <div class="item-row"><span>Total:</span><span>₱${total.toFixed(2)}</span></div>
          </div>

          <div class="line"></div>

          <div class="center">${new Date().toLocaleString()}</div>
          <div class="center">Thank you for your order!</div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `;

    const win = window.open("", "width=300,height=600");
    win?.document.write(receiptHTML);
    win?.document.close();
    
    setOnlineReceiptLoading(false);
  };

  // Handle given amount input
  const handleGivenAmountChange = (value: string) => {
    setGivenAmount(value); // keep as string
    const numericValue = Number(value);

    if (numericValue < total) {
      setError('Given amount cannot be less than total');
      setChange(0);
    } else {
      setError('');
      setChange(numericValue - total);
    }
  };

  
  const handleSubmitPayment = async () => {
    setPaymentLoading(true);
    
    await printReceipt(order, Number(givenAmount), change);
    updateOrderStatus?.(order.id, 'to prepare');

    setPaymentLoading(false);
    closeModal();
  };

  const handleUpdateOnlineOrderStatus = async () => {
    setOnlineReceiptLoading(true);
    
    await printOnlineReceipt(order);
    updateOrderStatus?.(order.id, 'to prepare');

    setOnlineReceiptLoading(false);
    closeOnlineModal();
  }

  // Handle status update with loading
    const handleStatusUpdate = async (orderId: string, status: string, buttonText: string) => {
    if (!updateOrderStatus) return;
    
    setLoading(buttonText); // Use the button text (e.g., "order claimed") as the loading key
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 600));
    updateOrderStatus(orderId, status); // status is the final value like "completed"
    setLoading(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col h-full">
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
              className={`mt-1 w-fit px-2 py-0.5 rounded-md text-xs font-medium uppercase ${getModeColor?.(
                order.orderMode
              )}`}
            >
              {order.orderMode}
            </span>
          )}

          {order.paymentMethod && (
            <div className="text-sm text-gray-700 font-medium mt-1">
              Method: {order.paymentMethod}
            </div>
          )}

          {order.paymentStatus && (
            <div className="text-sm text-gray-700 font-medium mt-1">
              Status: {order.paymentStatus}
            </div>
          )}

          {/* Delivery Fee Badge - Only show for ONLINE orders */}
          {!isKioskOrder && hasDeliveryFee && (
            <div className="mt-1 inline-flex items-center text-xs text-gray-600">
              <Truck className="w-3 h-3 mr-1" />
              Delivery: ₱{effectiveDeliveryFee.toFixed(2)}
            </div>
          )}

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="mt-2 inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              <Award className="w-3 h-3 mr-1" />
              {displayDiscountType} Discount (₱{displayDiscountAmount.toFixed(2)})
            </div>
          )}
        </div>

        <span
          className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor?.(
            order.orderStatus === 'mark as ready'
              ? order.orderSource === 'KIOSK'
                ? 'ready to serve'
                : 'ready for pickup'
              : order.orderStatus
          )}`}
        >
          {order.orderStatus === 'mark as ready'
            ? order.orderSource === 'KIOSK'
              ? 'ready to serve'
              : 'ready for pickup'
            : order.orderStatus}
        </span>
      </div>

      <span className="mt-1 w-fit px-2 py-0.5 rounded-md text-xs font-medium uppercase">
        {order.orderSource}
      </span>

      {/* Middle content */}
      <div className="border-t pt-3 space-y-1 flex-1">
        {order.orderItems.map((item) => {
          const itemHasDiscount = isKioskOrder && discountEligible && kioskDiscountedItem?.id === item.id;
          const itemTotal = item.price * item.quantity;
          const discountedTotal = itemHasDiscount && kioskDiscountedItem 
            ? itemTotal - kioskDiscountedItem.discountAmount 
            : itemTotal;
          
          return (
            <div key={item.id} className="text-sm">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <strong>{item.quantity}x</strong> {item.product.name}{" "}
                  {item.variantLabel ? `(${item.variantLabel})` : ""}
                  {itemHasDiscount && (
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-1.5 py-0.5 rounded ml-1">
                      20% OFF
                    </span>
                  )}
                </span>
                <span className="font-medium">
                  {itemHasDiscount ? (
                    <span className="text-green-600">₱{discountedTotal.toFixed(2)}</span>
                  ) : (
                    formatPhp?.(itemTotal)
                  )}
                </span>
              </div>
              {itemHasDiscount && kioskDiscountedItem && (
                <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                  <span className="ml-4">Discount: -₱{kioskDiscountedItem.discountAmount.toFixed(2)}</span>
                  <span className="line-through text-gray-400">₱{itemTotal.toFixed(2)}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Delivery Fee Line - Only show for ONLINE orders */}
        {!isKioskOrder && hasDeliveryFee && (
          <div className="flex justify-between text-sm text-gray-600 mt-1 pt-1 border-t border-dashed border-gray-200">
            <span className="flex items-center">
              <Truck className="w-3 h-3 mr-1" />
              Delivery Fee
            </span>
            <span>₱{effectiveDeliveryFee.toFixed(2)}</span>
          </div>
        )}

        {/* Discount Summary */}
        {hasDiscount && (
          <div className="border-t border-green-200 mt-2 pt-2 text-xs bg-green-50 p-2 rounded">
            <div className="flex justify-between text-green-700">
              <span className="font-medium">Original Subtotal:</span>
              <span>₱{originalSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-700">
              <span className="font-medium">Discount ({displayDiscountType} 20%):</span>
              <span>-₱{displayDiscountAmount.toFixed(2)}</span>
            </div>
            {displayDiscountDetails?.appliedToItem && (
              <div className="mt-1 text-green-600 border-t border-green-200 pt-1">
                <p className="font-medium text-xs">Applied to:</p>
                <p className="text-xs">{displayDiscountDetails.appliedToItem.name}</p>
              </div>
            )}
          </div>
        )}

        <div className="border-t mt-2 pt-2 text-sm font-semibold flex justify-between">
          <span>Total:</span>
          <span className={hasDiscount ? 'text-green-600' : ''}>₱{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-4 flex flex-col gap-2">
          {getNextStatuses &&
          getNextStatuses(order).length > 0 &&
          updateOrderStatus &&
          order.orderSource === 'KIOSK' &&
          order.paymentStatus === 'paid' &&
          order.orderStatus === 'mark as ready' && (
            <button
              onClick={() => {
                const next = getNextStatuses(order)?.[0];
                let finalValue = next;

                if (order.orderSource === 'ONLINE') {
                  if (next === 'order claimed') finalValue = 'out for delivery';
                } else {
                  if (next === 'order claimed') finalValue = 'completed';
                }

                handleStatusUpdate(order.id, finalValue, next);
              }}
              disabled={loading === getNextStatuses(order)[0]}
              className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm disabled:bg-amber-500 disabled:cursor-not-allowed relative flex items-center justify-center"
            >
              {loading === getNextStatuses(order)[0] ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : (
                getNextStatuses(order)[0].charAt(0).toUpperCase() + getNextStatuses(order)[0].slice(1)
              )}
            </button>
          )}

         {getNextStatuses &&
          getNextStatuses(order).length > 0 &&
          updateOrderStatus &&
          order.orderSource === 'ONLINE' &&
          order.paymentStatus === 'paid' &&
          order.orderStatus === 'mark as ready' && (
            <button
              onClick={() => {
                const next = getNextStatuses(order)?.[0];
                let finalValue = next;

                if (order.orderSource === 'ONLINE') {
                  if (next === 'order claimed') finalValue = 'out for delivery';
                } else {
                  if (next === 'order claimed') finalValue = 'completed';
                }

                handleStatusUpdate(order.id, finalValue, next);
              }}
              disabled={loading === getNextStatuses(order)[0]}
              className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm disabled:bg-amber-500 disabled:cursor-not-allowed relative flex items-center justify-center"
            >
              {loading === getNextStatuses(order)[0] ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : (
                getNextStatuses(order)[0].charAt(0).toUpperCase() + getNextStatuses(order)[0].slice(1)
              )}
            </button>
          )}

        {getNextStatuses &&
          getNextStatuses(order).length > 0 &&
          updateOrderStatus &&
          order.orderSource === 'KIOSK' &&
          order.paymentStatus === 'unpaid' && (
            <button
              onClick={() => showPaymentModal(order.id)}
              className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm"
            >
              Pay Order
            </button>
          )}

        {getNextStatuses &&
          getNextStatuses(order).length > 0 &&
          updateOrderStatus &&
          order.orderSource === 'ONLINE' &&
          order.orderStatus === 'confirmed' && (
            <button
              onClick={() => showDetailsModal(order)}
              className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm"
            >
              View Details
            </button>
          )}
      </div>

      {/* Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-96 p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 font-bold"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">Payment</h2>

            <p><strong>Order Number:</strong> {order.orderNumber}</p>
            <p><strong>Transaction Number:</strong> {order.transactionNumber}</p>

            {/* Discount Eligibility Section - Only for KIOSK orders */}
            {isKioskOrder && (
              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={discountEligible}
                    onChange={(e) => setDiscountEligible(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Discount Eligible</span>
                </label>

                {discountEligible && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Discount Type
                    </label>
                    <select
                      value={discountType || ''}
                      onChange={(e) => setDiscountType(e.target.value as 'PWD' | 'SENIOR')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="">Select type</option>
                      <option value="PWD">PWD</option>
                      <option value="SENIOR">Senior Citizen</option>
                    </select>

                    {discountType && kioskDiscountedItem && (
                      <div className="mt-3 p-2 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-700 font-medium">20% discount applied to:</p>
                        <p className="text-sm text-green-800 mt-1">{kioskDiscountedItem.name}</p>
                        <div className="flex justify-between text-xs text-green-600 mt-1">
                          <span>Original: ₱{kioskDiscountedItem.originalPrice.toFixed(2)}</span>
                          <ChevronRight className="w-3 h-3" />
                          <span>Discounted: ₱{kioskDiscountedItem.discountedPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Delivery Fee Info - Only show for ONLINE orders */}
            {!isKioskOrder && hasDeliveryFee && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700 font-medium flex items-center">
                  <Truck className="w-3 h-3 mr-1" />
                  Delivery Fee: ₱{effectiveDeliveryFee.toFixed(2)}
                </p>
              </div>
            )}

            {/* Discount Info - Show for existing discounts */}
            {!isKioskOrder && hasDiscount && (
              <div className="mt-2 p-2 bg-green-50 rounded-lg">
                <p className="text-xs text-green-700 font-medium flex items-center">
                  <Award className="w-3 h-3 mr-1" />
                  {order.discountType} Discount Applied: -₱{order.discountAmount?.toFixed(2)}
                </p>
              </div>
            )}

            <div className="my-4 border-t border-b py-2 max-h-48 overflow-y-auto">
              {order.orderItems.map((item) => {
                const itemHasDiscount = isKioskOrder && discountEligible && kioskDiscountedItem?.id === item.id;
                const itemTotal = item.price * item.quantity;
                const discountedTotal = itemHasDiscount && kioskDiscountedItem 
                  ? itemTotal - kioskDiscountedItem.discountAmount 
                  : itemTotal;
                
                return (
                  <div key={item.id} className="flex justify-between mb-1">
                    <span className="flex items-center">
                      {item.product.name} {item.variantLabel ? `(${item.variantLabel})` : ''} x{item.quantity}
                      {itemHasDiscount && (
                        <span className="ml-1 bg-green-100 text-green-800 text-xs font-bold px-1 py-0.5 rounded">
                          20% OFF
                        </span>
                      )}
                    </span>
                    <span className={itemHasDiscount ? 'text-green-600' : ''}>
                      {itemHasDiscount ? (
                        <>
                          <span className="line-through text-gray-400 mr-1">₱{itemTotal.toFixed(2)}</span>
                          ₱{discountedTotal.toFixed(2)}
                        </>
                      ) : (
                        formatPhp?.(itemTotal) || itemTotal
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {hasDiscount && (
              <div className="mb-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>₱{originalSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-₱{displayDiscountAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            {!isKioskOrder && hasDeliveryFee && (
              <div className="mb-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee:</span>
                  <span>+₱{effectiveDeliveryFee.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between font-bold mb-4">
              <span>Total:</span>
              <span className={hasDiscount ? 'text-green-600' : ''}>₱{total.toFixed(2)}</span>
            </div>

            <div className="mb-2">
              <label className="block mb-1 font-medium">Cash Amount</label>
              <input
                type="number"
                value={givenAmount}
                onChange={(e) => handleGivenAmountChange(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Enter amount given by customer"
              />

              <button
                type="button"
                onClick={() => handleGivenAmountChange(String(total))}
                className="mt-2 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded w-full font-medium"
              >
                Exact Amount
              </button>

              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              {change > 0 && !error && <p className="text-green-600 text-sm mt-1">Change: ₱{change.toFixed(2)}</p>}
            </div>

            <button
              onClick={handleSubmitPayment}
              disabled={Number(givenAmount) < total || paymentLoading}
              className={`w-full py-2 rounded-lg font-medium relative flex items-center justify-center ${
                Number(givenAmount) < total
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              {paymentLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing Payment...
                </>
              ) : (
                'Submit Payment'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800">Order Details</h2>

            <div className="space-y-1 text-sm">
              <p><strong>Order #:</strong> {selectedOrder.orderNumber}</p>
              <p><strong>Customer:</strong> {selectedOrder.customerName}</p>
              <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
              <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
              <p><strong>Address:</strong> {selectedOrder.deliveryAddress}</p>
              <p><strong>Payment:</strong> {selectedOrder.paymentMethod}</p>
              <p><strong>Status:</strong> {selectedOrder.paymentStatus}</p>
              {!isKioskOrder && selectedOrder.deliveryFee && selectedOrder.deliveryFee > 0 && (
                <p><strong>Delivery Fee:</strong> ₱{selectedOrder.deliveryFee.toFixed(2)}</p>
              )}
            </div>

            {/* Discount Info */}
            {selectedOrder.discountApplied && (
              <div className="bg-green-50 p-3 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                  <Award className="w-4 h-4 mr-1" />
                  {selectedOrder.discountType} Discount Applied
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Discount Amount:</span>
                    <span className="text-green-600">-₱{(selectedOrder.discountAmount || 0).toFixed(2)}</span>
                  </div>
                  {selectedOrder.discountDetails?.appliedToItem && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <p className="font-medium text-xs">Applied to highest-priced item:</p>
                      <p className="text-sm">{selectedOrder.discountDetails.appliedToItem.name}</p>
                      <div className="flex justify-between text-xs mt-1">
                        <span>Original: ₱{selectedOrder.discountDetails.appliedToItem.originalPrice.toFixed(2)}</span>
                        <ChevronRight className="w-3 h-3" />
                        <span>Discounted: ₱{selectedOrder.discountDetails.appliedToItem.discountedPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border-t pt-3">
              <h3 className="font-semibold text-gray-800">Items</h3>
              <div className="space-y-2 text-sm">
                {selectedOrder.orderItems.map((item) => {
                  const itemHasDiscount = item.discountApplied;
                  const itemTotal = item.price * item.quantity;
                  const discountedTotal = itemHasDiscount && item.discountedPrice ? item.discountedPrice : itemTotal;
                  
                  return (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <span>
                          {item.quantity} x {item.product.name} {item.variantLabel ? `(${item.variantLabel})` : ''}
                        </span>
                        {itemHasDiscount && (
                          <span className="ml-2 bg-green-100 text-green-800 text-xs font-bold px-1 py-0.5 rounded">
                            20% OFF
                          </span>
                        )}
                      </div>
                      <span className={itemHasDiscount ? 'text-green-600' : ''}>
                        {itemHasDiscount ? (
                          <>
                            <span className="line-through text-gray-400 mr-1">₱{itemTotal.toFixed(2)}</span>
                            ₱{discountedTotal.toFixed(2)}
                          </>
                        ) : (
                          `₱${itemTotal.toFixed(2)}`
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedOrder.discountApplied && (
              <div className="border-t pt-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₱{originalSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-₱{(selectedOrder.discountAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            )}

            {!isKioskOrder && selectedOrder.deliveryFee && selectedOrder.deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span>Delivery Fee:</span>
                <span>₱{selectedOrder.deliveryFee.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t pt-3 font-bold flex justify-between">
              <span>Total:</span>
              <span className={selectedOrder.discountApplied ? 'text-green-600' : ''}>
                ₱{(selectedOrder.total || selectedOrder.subtotal || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => handleUpdateOnlineOrderStatus()}
                disabled={onlineReceiptLoading}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm disabled:bg-amber-500 disabled:cursor-not-allowed relative flex items-center justify-center min-w-[120px]"
              >
                {onlineReceiptLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Printing...
                  </>
                ) : (
                  'Print Receipt'
                )}
              </button>

              <button
                onClick={closeOnlineModal}
                disabled={onlineReceiptLoading}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}