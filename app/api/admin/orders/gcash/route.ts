// app/api/admin/orders/gcash/route.ts
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Build filter conditions
    const where: any = {
      paymentMethod: 'GCASH',
    };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      if (status === 'verifying') {
        where.paymentStatus = 'verifying';
      } else if (status === 'paid') {
        where.paymentStatus = 'paid';
      } else if (status === 'failed') {
        where.paymentStatus = 'failed';
      } else if (status === 'unpaid') {
        where.paymentStatus = 'unpaid';
      }
    } else {
      where.paymentStatus = {
        in: ['verifying', 'paid', 'failed'],
      };
    }
    
    // Fetch orders with related data including discount information
    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                category: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        discountApproval: {
          select: {
            id: true,
            discountType: true,
            status: true,
            reviewedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Format the response with detailed discount information
    const formattedOrders = orders.map(order => {
      // Parse discountDetails if it exists
      let discountDetails = null;
      if (order.discountDetails) {
        try {
          discountDetails = typeof order.discountDetails === 'string' 
            ? JSON.parse(order.discountDetails) 
            : order.discountDetails;
        } catch (e) {
          console.error('Error parsing discountDetails for order', order.orderNumber, e);
        }
      }

      // Calculate original subtotal from order items
      const calculatedSubtotal = order.orderItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        transactionNumber: order.transactionNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        deliveryZipCode: order.deliveryZipCode,
        subtotal: order.subtotal,
        calculatedSubtotal: calculatedSubtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        gcashReference: order.gcashReference,
        gcashReceiptUrl: order.gcashReceiptUrl, // Add this line
        orderNotes: order.orderNotes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        
        // Discount fields
        discountApplied: order.discountApplied || false,
        discountType: order.discountType,
        discountAmount: order.discountAmount || 0,
        discountDetails: discountDetails,
        discountApproval: order.discountApproval,
        
        // Order items with detailed discount info
        orderItems: order.orderItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          variantId: item.variantId,
          variantLabel: item.variantLabel,
          discountApplied: item.discountApplied || false,
          discountAmount: item.discountAmount || 0,
          discountedPrice: item.discountedPrice,
          isHighestPriced: item.isHighestPriced || false,
          product: {
            id: item.product.id,
            name: item.product.name,
            image: item.product.image,
            category: item.product.category,
          },
        })),
        
        // User info if available
        user: order.user ? {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
        } : null,
      };
    });
    
    return NextResponse.json(formattedOrders);
    
  } catch (error) {
    console.error('Error fetching GCash orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GCash orders' },
      { status: 500 }
    );
  }
}