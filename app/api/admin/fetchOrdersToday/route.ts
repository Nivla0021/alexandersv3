// app/api/admin/fetchOrders/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: { createdAt: "asc" },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
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
    });

    // Map to include variantLabel and discount fields
    const mappedOrders = orders.map((order) => {
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

      // Force delivery fee to 0 for KIOSK orders
      // For ONLINE orders, use the stored delivery fee or default to 0
      const deliveryFee = order.orderSource === 'KIOSK' 
        ? 0 
        : (order.deliveryFee || 0);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        transactionNumber: order.transactionNumber,
        orderSource: order.orderSource,
        orderMode: order.orderMode,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        orderNotes: order.orderNotes,
        subtotal: order.subtotal,
        total: order.total,
        // Use the conditional delivery fee
        deliveryFee: deliveryFee,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        deliveryZipCode: order.deliveryZipCode,
        locationData: order.locationData,
        gcashReference: order.gcashReference,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        
        // Discount fields
        discountApplied: order.discountApplied || false,
        discountType: order.discountType,
        discountAmount: order.discountAmount || 0,
        discountDetails: discountDetails,
        discountApproval: order.discountApproval,
        
        // Order items with discount info
        orderItems: order.orderItems.map((item) => ({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          variantId: item.variantId,
          variantLabel: item.variantLabel ?? "",
          // Discount fields for each item
          discountApplied: item.discountApplied || false,
          discountAmount: item.discountAmount || 0,
          discountedPrice: item.discountedPrice,
          isHighestPriced: item.isHighestPriced || false,
        })),
      };
    });

    return NextResponse.json(mappedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders", details: (error as any).message },
      { status: 500 }
    );
  }
}