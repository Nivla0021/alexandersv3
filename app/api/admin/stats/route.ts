import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all counts in parallel for better performance
    const [
      totalOrders,
      todayOrders,
      totalProducts,
      gcashPendingOrders
    ] = await Promise.all([
      // Total orders
      prisma.order.count(),
      
      // Today's orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),
      
      // Total products
      prisma.product.count({
        where: {
          available: true, // Only count available products
        },
      }),
      
      // GCash pending orders (awaiting payment or verifying)
      prisma.order.count({
        where: {
          paymentMethod: 'GCASH',
          paymentStatus: {
            in: ['awaiting_payment', 'verifying'],
          },
        },
      }),
    ]);

    return NextResponse.json({
      todayOrders,
      totalOrders,
      totalProducts,
      gcashPendingOrders,
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { 
        todayOrders: 0,
        totalOrders: 0,
        totalProducts: 0,
        gcashPendingOrders: 0,
        error: 'Failed to fetch dashboard statistics' 
      },
      { status: 500 }
    );
  }
}