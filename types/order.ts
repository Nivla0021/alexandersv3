// types/order.ts
export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
  };
}

export interface OrderPayload {
  id: string;
  orderNumber: string;
  customerName?: string;
  orderStatus: string;
  createdAt?: string;
  orderItems: OrderItem[];
  orderSource: string;
  subtotal?: number;
  total?: number;
  orderMode?: string;
  transactionNumber?: string;
  orderNotes?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}
