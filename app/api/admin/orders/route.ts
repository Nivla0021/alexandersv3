import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, orderStatus } = await request.json();

    if (!id || !orderStatus) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 1️⃣ Fetch existing order
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: {
          orderItems: {
            include: { product: true },
          },
          productSales: true,
        },
      });

      if (!existingOrder) {
        throw new Error('Order not found');
      }

      // 2️⃣ Update order status
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { orderStatus },
      });

      // 3️⃣ Only generate sales ONCE
      const shouldCreateSales =
        orderStatus === 'completed' &&
        existingOrder.orderStatus !== 'completed' &&
        existingOrder.productSales.length === 0;

      if (shouldCreateSales) {
        await tx.productSale.createMany({
          data: existingOrder.orderItems.map((item: any) => ({
            orderId: existingOrder.id,
            productId: item.productId,
            productName: item.product.name,
            category: item.product.category,
            unitPrice: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity,
          })),
          skipDuplicates: true, // 🔒 extra safety
        });
      }

      return updatedOrder;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

