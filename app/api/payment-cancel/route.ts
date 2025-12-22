// API endpoint to mark order as payment failed when user cancels
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderNumber } = body;

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Order number is required' },
        { status: 400 }
      );
    }

    // Find and update the order
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: { id: true, orderNumber: true, paymentStatus: true },
    });

    if (!order) {
      console.log(`Order ${orderNumber} not found`);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only update if not already paid
    if (order.paymentStatus === 'paid') {
      console.log(`Order ${orderNumber} already paid, skipping update`);
      return NextResponse.json({ 
        message: 'Order already paid',
        order 
      });
    }

    // Update order to failed/cancelled
    const updated = await prisma.order.update({
      where: { orderNumber },
      data: {
        paymentStatus: 'failed',
        orderStatus: 'cancelled',
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Order ${orderNumber} marked as failed due to payment cancellation`);

    return NextResponse.json({
      success: true,
      message: 'Order marked as cancelled',
      order: updated,
    });
  } catch (error: any) {
    console.error('Error cancelling payment:', error);
    return NextResponse.json(
      { error: 'Failed to cancel payment', message: error.message },
      { status: 500 }
    );
  }
}
