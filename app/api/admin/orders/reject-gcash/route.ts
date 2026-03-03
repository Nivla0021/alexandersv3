// app/api/admin/orders/reject-gcash/route.ts
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { sendPaymentRejectionEmail } from '@/lib/email'; // You'll need to create this function

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, reason } = body;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }
    
    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Check if it's a GCash order
    if (order.paymentMethod !== 'GCASH') {
      return NextResponse.json(
        { error: 'Only GCash orders can be rejected' },
        { status: 400 }
      );
    }
    
    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'failed',
        orderStatus: 'cancelled',
        updatedAt: new Date(),
        // Store rejection reason in notes
        orderNotes: `[PAYMENT REJECTED] ${reason}\n\nPrevious notes: ${order.orderNotes || ''}`.trim(),
      },
    });
    
    // Send rejection notification to customer
    if (order.customerEmail) {
      // You can create a function to send rejection emails
      // For now, we'll just log it
      console.log(`Payment rejected for order ${order.orderNumber}`);
      console.log(`Reason: ${reason}`);
      console.log(`Customer email: ${order.customerEmail}`);
      
      // In the reject-gcash route, after updating the order status:
    // In the reject-gcash route, after updating the order status:
    await sendPaymentRejectionEmail({
        customerName: order.customerName || '',
        customerEmail: order.customerEmail,
        orderNumber: order.orderNumber,
        reason: reason,
        total: order.total,
        gcashReference: order.gcashReference || undefined,
    }).catch(err => console.error('Failed to send rejection email:', err));
    }
    
    console.log(`GCash payment rejected for order ${order.orderNumber}. Reason: ${reason}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Payment rejected successfully',
      order: updatedOrder 
    });
    
  } catch (error: any) {
    console.error('Error rejecting GCash payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject payment' },
      { status: 500 }
    );
  }
}