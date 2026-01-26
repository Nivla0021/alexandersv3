import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // 🔐 Allow admin or store-manager only
    const role = (session?.user as any)?.role;
    if (!session || !['admin', 'store-manager'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, orderStatus } = await request.json();

    if (!id || !orderStatus) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Fetch with sales + items
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: {
          orderItems: { include: { product: true } },
          productSales: true
        }
      });

      if (!existingOrder) {
        throw new Error('Order not found');
      }

      // 2️⃣ Generate orderNumber ONCE if missing
      let finalOrderNumber = existingOrder.orderNumber;

      if (!finalOrderNumber) {
        finalOrderNumber = `ORD-${String(existingOrder.id.slice(-4)).padStart(4, '0')}`;

        await tx.order.update({
          where: { id },
          data: { orderNumber: finalOrderNumber }
        });
      }

      // 3️⃣ Determine payment status
      let paymentStatus = 'unpaid';
      if (orderStatus !== 'pending' && orderStatus !== 'cancelled') {
        paymentStatus = 'paid';
      }

      // 4️⃣ Update order with new status + paymentStatus
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { orderStatus, paymentStatus }
      });

      // 5️⃣ Create productSales once when completed
      const shouldCreateSales =
        orderStatus === 'completed' &&
        existingOrder.orderStatus !== 'completed' &&
        existingOrder.productSales.length === 0;

      if (shouldCreateSales) {
        await tx.productSale.createMany({
          data: existingOrder.orderItems.map((item) => ({
            orderId: existingOrder.id,
            productId: item.productId,
            productName: item.product.name,
            category: item.product.category,
            unitPrice: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
          })),
          skipDuplicates: true
        });
      }

      return { ...updatedOrder, orderNumber: finalOrderNumber };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to update order' },
      { status: 500 }
    );
  }
}
