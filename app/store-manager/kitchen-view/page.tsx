// dapat magkaiba kulang ng badge 
// pickup: bg-[#3B82F6]
// to serve: bg-[#D97706]
// wag na i-display ang price and total

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, CheckCircle, ShoppingBag } from 'lucide-react';
import { Icon } from "@iconify/react";

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
    variantLabel?: string | null; // added
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


    const fetchOrdersInterval = () => {
      fetchOrders();
      const intervalId = setInterval(fetchOrders, 5000); // every 5 seconds
      return intervalId;
    };

    const intervalId = fetchOrdersInterval();

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

const fetchOrders = async () => {
  try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/fetchOrdersToday`,
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
      if (status === 'to prepare') return ['preparing'];
      if (status === 'preparing') return ['mark as ready'];
      if (status === 'mark as ready') return [];
      return [];
    }

    // === KIOSK FLOW ===
    if (source === 'KIOSK') {
      if (status === 'to prepare') return ['preparing'];
      if (status === 'preparing') return ['mark as ready'];
      if (status === 'mark as ready') return [];
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
    const matchesStatus = ['to prepare', 'preparing']
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
        return 'bg-blue-100 text-white-800';
      case 'to prepare':
        return 'bg-yellow-100 text-yellow-800';
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
        return '';
      case 'TAKE-OUT':
      case 'TAKEOUT':
        return '';
      case 'ONLINE':
        return '';
      case 'KIOSK':
        return '';
      default:
        return '';
    }
  };

//  const printReceipt = (order: Order) => {
//     const win = window.open('', '_blank', 'width=300,height=600');
//     if (!win) return;

//     const isOnline = order.orderSource?.toUpperCase() === 'ONLINE';
//     const lineWidth = 32; // Approx chars per line for 58mm printer

//     // Helper to format a line with qty, name, price
//     const formatLine = (qty: number, name: string, price: number) => {
//       const qtyStr = String(qty).padStart(2, ' ');
//       // Truncate name if too long
//       const maxNameLength = lineWidth - 2 - 1 - 8; // qty + space + price width
//       const nameStr = name.length > maxNameLength ? name.slice(0, maxNameLength - 1) + '…' : name;
//       const priceStr = `₱${price.toFixed(2)}`;
//       const spaces = ' '.repeat(lineWidth - qtyStr.length - 1 - nameStr.length - priceStr.length);
//       return `${qtyStr} ${nameStr}${spaces}${priceStr}`;
//     };

//     const itemsText = order.orderItems.map(item => formatLine(item.quantity, item.product.name, item.price)).join('<br>');

//     const customerFields = isOnline
//       ? `
//         <p>Name: ${order.customerName}</p>
//         <p>Email: ${order.customerEmail}</p>
//         <p>Phone: ${order.customerPhone}</p>
//         <p>Address: ${order.deliveryAddress}</p>
//       `
//       : `<p>Name: Walk-in</p>`;

//     win.document.write(`
//       <html>
//         <head>
//           <title>Receipt ${order.orderNumber}</title>
//           <style>
//             body {
//               font-family: monospace;
//               font-size: 12px;
//               line-height: 1.2;
//               width: 250px; /* 58mm printer width */
//               padding: 4px 0;
//             }
//             hr { border: 1px dashed #000; margin: 4px 0; }
//             .center { text-align: center; }
//             .right { text-align: right; }
//             .footer { font-size: 10px; text-align: center; margin-top: 4px; }
//             .bold { font-weight: bold; }
//           </style>
//         </head>
//         <body>
//           <div class="center bold">Alexander's</div>
//           <div class="center">*** Receipt ***</div>
//           <hr>
//           <p>Order #: ${order.orderNumber}</p>
//           <p>Transaction #: ${order.transactionNumber}</p>
//           <p>Source: ${order.orderSource}</p>
//           <p>Mode: ${order.orderMode || 'N/A'}</p>

//           <hr>
//           <div class="bold">Customer Info:</div>
//           ${customerFields}

//           <hr>
//           <div class="bold">Items:</div>
//           <p>${itemsText}</p>

//           <hr>
//           <p>Subtotal: ₱${order.subtotal.toFixed(2)}</p>
//           <p>Total: ₱${order.total.toFixed(2)}</p>
//           <p>Payment: ${order.paymentMethod} (${order.paymentStatus})</p>

//           <hr>
//           <div class="footer">
//             <p>Printed: ${new Date().toLocaleString()}</p>
//             <p>Thank you for your order!</p>
//           </div>
//         </body>
//       </html>
//     `);

//     win.document.close();
//     win.print();
//   };

  // UI Loading ------------------------------------------------------------------------------------
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <p className="text-gray-600">Loading orders...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen tracking-[1px] text-white bg-[#111827]">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center text-white lg:px-9 px-5 py-5 lg:text-[14px] md:text-[13.5px] text-[13px] leading-none bg-[#1F2937]" style={{ boxShadow: "box-shadow: rgba(0, 0, 0, 0.15) 0px 3px 3px 0px" }}>
            <Link href="/store-manager/dashboard" className="text-white/80 hover:text-white" >
                <div className="flex items-center md:gap-2 gap-1">
                    {/* <ArrowLeft className="" /> */}
                    <Icon icon="iconamoon:arrow-left-2" className="md:text-3xl text-2xl leading-none" />
                    <p className='xl:text-[22px] md:text-[20px] text-[18px] font-bold'>Alexander's</p>

                </div>
            </Link>
        </header>

        {/* Orders List */}
        <main className="h-full mt-16 md:pt-12 pt-5 pb-12 mx-6 lg:mx-10 md:space-y-8 space-y-6">
            <div className='flex xl:text-[14px] sm:text-[13.5px] text-[13px] md:gap-3 gap-2'>
                <input
                  type="text"
                  className="w-full md:p-3 px-3 py-2.5 rounded-lg border border-white/50 text-white
                            placeholder-white/60 focus:outline-none focus:border-transparent 
                            focus:ring focus:ring-[#3B82F6] bg-[#1F2937]"
                  placeholder="Search order # or transaction #"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <select
                  className="px-3 py-2 text-white bg-[#1F2937] border border-white/50 rounded-lg
                            focus:text-white focus:border-white"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as any)}
                >
                  <option className="text-black bg-white" value="ALL">All</option>
                  <option className="text-black bg-white" value="KIOSK">Kiosk</option>
                  <option className="text-black bg-white" value="ONLINE">Online</option>
                </select>
            </div>

            <div>
                {todayOrders.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-600 font-medium">No orders today</p>
                    </div>
                ) : (
                    <div className="grid 2xl:grid-cols-5 xl:grid-cols-3 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-2 grid-cols-1 gap-6">
                        {todayOrders.map((order) => (
                            <div key={order.id} className="bg-[#1F2937] rounded-xl flex flex-col" >
                                <div className='p-5 space-y-3 lg:space-y-4 flex flex-col flex-1 justify-between'>
                                  <div className="flex-1 space-y-3 lg:space-y-4">
                                    {/* Top section */}
                                      <div className="flex justify-between items-center leading-none">
                                          <div className="space-y-1">
                                              <p className="2xl:text-[24px] lg:text-[22px] text-[20px] font-semibold">{order.orderNumber}</p>
                                              {order.transactionNumber && (
                                                  <p className="text-[12px] text-white/50">TXN: {order.transactionNumber}</p>
                                              )}
                                          </div>
                                          
                                          <div className={`h-6 flex items-center text-[12px] capitalize md:px-3 px-2 bg-[#3B82F6] rounded-full ${getStatusColor( order.orderStatus )}`} >
                                              {order.orderStatus === 'paid' ? 'preparing' : order.orderStatus}
                                          </div>
                                          {/* <div className="h-6 flex items-center text-[12px] px-3 bg-[#3B82F6] rounded-full">{order.orderStatus}</div> */}
                                      </div>
                                    
                                    {/* order items */}
                                    <div className='flex flex-col gap-3'>
                                        <hr className='border-[#374151]/30' />
                                        <div className="flex justify-between text-[12px] leading-none uppercase rounded-md">
                                            <p className="">{order.orderSource}</p>
                                            {order.orderMode && (
                                                <p className={`text-[#F59E0B] font-semibold ${getModeColor( order.orderMode )}`} >
                                                    {order.orderMode}
                                                </p>
                                            )}
                                        </div>
                                        <hr className='border-[#374151]/30' />

                                        {order.orderItems.map((item) => (
                                          <p key={item.id} className="text-sm flex justify-between">
                                            <span>
                                              <strong>{item.quantity} </strong> {item.product.name}{" "}
                                              {item.variantLabel ? `(${item.variantLabel})` : ""}
                                            </span>
                                          </p>
                                        ))}

                                        <hr className='border-[#374151]/30' />
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
                                          className="w-full py-2 bg-[#fa8e13] text-white/85 hover:text-white rounded-lg hover:bg-[#e27901] font-medium text-sm cursor-pointer"
                                        >
                                          View Order Notes
                                        </button>
                                      )}

                                      <button
                                        onClick={() => updateOrderStatus(order.id, getNextStatuses(order)[0])}
                                        className="xl:text-[14px] sm:text-[13.5px] text-[13px] text-white/85 hover:text-white py-2 bg-[#0ba574] hover:bg-[#01865C] rounded-lg cursor-pointer"
                                      >
                                        {getNextStatuses(order)[0]}
                                      </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showNotesModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
                        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full space-y-4">
                            <h2 className="text-lg font-bold text-amber-900">Customer Notes</h2>

                            <p className="text-sm text-gray-700 whitespace-pre-line"> {selectedNotes} </p>

                            <button onClick={() => { setShowNotesModal(false); setSelectedNotes(null); }} className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium text-sm"> Close </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    </div>
  );

}
