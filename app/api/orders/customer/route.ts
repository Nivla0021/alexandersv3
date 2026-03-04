import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        NOT: {
          paymentStatus: 'unpaid'
        }
      },
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

    const ordersWithParsedDetails = orders.map(order => {
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

      const calculatedSubtotal = order.orderItems.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
      );

      return {
        ...order,
        discountApplied: order.discountApplied || false,
        discountType: order.discountType,
        discountAmount: order.discountAmount || 0,
        discountDetails: discountDetails,
        calculatedSubtotal: calculatedSubtotal,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
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
            name: item.product.name,
            image: item.product.image,
            category: item.product.category,
          },
        })),
      };
    });

    return NextResponse.json(ordersWithParsedDetails);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}