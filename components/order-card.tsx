import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { OrderPayload } from '@/types/order';

interface OrderCardProps {
  order: OrderPayload;
  showCancel?: boolean;
  setSelectedNotes?: (notes: string | null) => void;
  updateOrderStatus?: (id: string, status: string) => void;
  getNextStatuses?: (order: OrderPayload) => string[];
  getModeColor?: (mode: string) => string;
  getStatusColor?: (status: string) => string;
  formatPhp?: (value: number) => string;
}

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
  const [selectedOrder, setSelectedOrder] = useState<OrderPayload | null>(null)
  const [showModal, setShowModal] = useState(false);

  const showDetailsModal = (order: OrderPayload) => {
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
      setIsModalOpen(true);
      setGivenAmount('');
      setError('');
      setChange(0);
    }
  };

  const closeModal = () => setIsModalOpen(false);

  const total = order.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const printReceipt = (order: OrderPayload, given: number, change: number) => {
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
            ${order.orderItems
              .map(
                (item) => `
                  <div class="item-row">
                    <span>
                      ${item.quantity} x ${item.product.name} ${
                        item.variantLabel ? `(${item.variantLabel})` : ""
                      }
                    </span>
                    <span>₱${(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                `
              )
              .join("")}
          </div>

          <div class="line"></div>

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
  };


  const printOnlineReceipt = (order: OrderPayload) => {
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
                (item) => `
                <div class="item-row">
                  <span>
                    ${item.quantity} x ${item.product.name} ${
                      item.variantLabel ? `(${item.variantLabel})` : ""
                    }
                  </span>
                  <span>₱${(item.quantity * item.price).toFixed(2)}</span>
                </div>
              `
              )
              .join("")}
          </div>

          <div class="line"></div>

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

  
  const handleSubmitPayment = () => {
    
    printReceipt(order, Number(givenAmount), change);
    updateOrderStatus?.(order.id, 'to prepare');

    closeModal();
  };

  const handleUpdateOnlineOrderStatus = () => {
    printOnlineReceipt(order);
    updateOrderStatus?.(order.id, 'to prepare');

    closeOnlineModal();
  }


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
        {order.orderItems.map((item) => (
          <p key={item.id} className="text-sm flex justify-between">
            <span>
              <strong>{item.quantity}x</strong> {item.product.name}{" "}
              {item.variantLabel ? `(${item.variantLabel})` : ""}
            </span>
            <span className="font-medium">{formatPhp?.(item.price * item.quantity)}</span>
          </p>
        ))}

        <div className="border-t mt-2 pt-2 text-sm font-semibold flex justify-between">
          <span>Total:</span>
          <span>₱{total}</span>
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

                updateOrderStatus(order.id, finalValue);
              }}
              className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm"
            >
              {getNextStatuses(order)[0]}
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

                updateOrderStatus(order.id, finalValue);
              }}
              className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm"
            >
              {getNextStatuses(order)[0]}
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
          <div className="bg-white rounded-xl w-96 p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 font-bold"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">Payment</h2>

            <p><strong>Order Number:</strong> {order.orderNumber}</p>
            <p><strong>Transaction Number:</strong> {order.transactionNumber}</p>

            <div className="my-4 border-t border-b py-2 max-h-48 overflow-y-auto">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex justify-between mb-1">
                  <span>
                    {item.product.name} {item.variantLabel ? `(${item.variantLabel})` : ''} x{item.quantity}
                  </span>
                  <span>{formatPhp?.(item.price * item.quantity) || item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold mb-4">
              <span>Total:</span>
              <span>₱{total}</span>
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
              {change > 0 && !error && <p className="text-green-600 text-sm mt-1">Change: ₱{change}</p>}
            </div>

            <button
              onClick={handleSubmitPayment}
              className={`w-full py-2 rounded-lg font-medium ${
                Number(givenAmount) < total
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
              disabled={Number(givenAmount) < total}
            >
              Submit Payment
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Order Details</h2>

            <div className="space-y-1 text-sm">
              <p><strong>Order #:</strong> {selectedOrder.orderNumber}</p>
              <p><strong>Customer:</strong> {selectedOrder.customerName}</p>
              <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
              <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
              <p><strong>Address:</strong> {selectedOrder.deliveryAddress}</p>
              <p><strong>Payment:</strong> {selectedOrder.paymentMethod}</p>
              <p><strong>Status:</strong> {selectedOrder.paymentStatus}</p>
            </div>

            <div className="border-t pt-3">
              <h3 className="font-semibold text-gray-800">Items</h3>
              <div className="space-y-1 text-sm">
                {selectedOrder.orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.quantity} x {item.product.name} {item.variantLabel ? `(${item.variantLabel})` : ''}
                    </span>
                    <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-3 font-bold flex justify-between">
              <span>Total:</span>
              <span>₱{total.toFixed(2)}</span>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => handleUpdateOnlineOrderStatus()}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
              >
                Print Receipt
              </button>

              <button
                onClick={closeOnlineModal}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 text-sm"
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
