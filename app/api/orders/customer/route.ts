// /api/orders/customer/route.ts
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

    // Fetch all orders for the logged-in customer with detailed information
    // EXCLUDING orders with paymentStatus 'unpaid'
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        NOT: {
          paymentStatus: 'unpaid' // Exclude unpaid orders
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

    // Parse discountDetails for each order (since it's stored as JSON)
    const ordersWithParsedDetails = orders.map(order => {
      let discountDetails = null;
      
      if (order.discountDetails) {
        try {
          // Handle both string and object cases
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
        ...order,
        // Ensure all discount fields are properly formatted
        discountApplied: order.discountApplied || false,
        discountType: order.discountType,
        discountAmount: order.discountAmount || 0,
        discountDetails: discountDetails,
        // Include calculated subtotal for reference
        calculatedSubtotal: calculatedSubtotal,
        // Format dates for frontend
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        // Ensure orderItems have all necessary fields
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

// GET single order by ID - Also exclude unpaid orders
export async function GET_ORDER_BY_ID(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const orderId = params.id;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId, // Ensure the order belongs to the user
        NOT: {
          paymentStatus: 'unpaid' // Exclude unpaid orders
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
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Parse discountDetails
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

    // Format the response
    const formattedOrder = {
      ...order,
      discountDetails,
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

    return NextResponse.json(formattedOrder);
    
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}