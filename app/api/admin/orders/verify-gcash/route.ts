// app/api/admin/orders/verify-gcash/route.ts
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    // Find the order with items
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
    
    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: 'Order is already paid' },
        { status: 400 }
      );
    }
    
    // Check if it's a GCash order
    if (order.paymentMethod !== 'GCASH') {
      return NextResponse.json(
        { error: 'Only GCash orders can be verified' },
        { status: 400 }
      );
    }
    
    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        updatedAt: new Date(),
      },
    });
    
    // // Create product sales records
    // for (const item of order.orderItems) {
    //   await prisma.productSale.create({
    //     data: {
    //       productId: item.productId,
    //       orderId: order.id,
    //       productName: item.product.name,
    //       category: item.product.category || null,
    //       unitPrice: item.price,
    //       quantity: item.quantity,
    //       total: item.price * item.quantity,
    //     },
    //   });
    // }
    
    // Send confirmation email to customer
    if (order.customerEmail) {
      const emailItems = order.orderItems.map((item: any) => ({
        id: item.product.id,
        name: item.variantLabel
          ? `${item.product.name} (${item.variantLabel})`
          : item.product.name,
        price: item.price,
        quantity: item.quantity,
        variantLabel: item.variantLabel,
      }));
      
      await sendOrderConfirmationEmail({
        customerName: order.customerName || '',
        customerEmail: order.customerEmail,
        orderNumber: order.orderNumber,
        items: emailItems,
        subtotal: order.subtotal,
        total: order.total,
        deliveryFee: order.deliveryFee || 0,
        paymentMethod: 'GCash',
      }).catch(err => console.error('Email error:', err));
    }
    
    console.log(`GCash payment verified for order ${order.orderNumber}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Payment verified successfully',
      order: updatedOrder 
    });
    
  } catch (error: any) {
    console.error('Error verifying GCash payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}