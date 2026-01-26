import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const start = from ? new Date(from) : new Date();
    const end = to ? new Date(to) : new Date();

    // include whole end day
    end.setHours(23, 59, 59, 999);

    // Get product sales aggregated by product
    const productSales = await prisma.productSale.groupBy({
      by: ['productId', 'productName', 'category'],
      where: {
        soldAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
    });

    // Get category sales aggregated by category
    const categorySales = await prisma.productSale.groupBy({
      by: ['category'],
      where: {
        soldAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
    });

    // Get order statistics
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        orderStatus: {
          in: ['confirmed', 'delivered'],
        },
      },
      select: {
        id: true,
        total: true,
        orderStatus: true,
        paymentMethod: true,
        createdAt: true,
      },
    });

    // Calculate statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const codOrders = orders.filter(o => o.paymentMethod === 'COD').length;
    const gcashOrders = orders.filter(o => o.paymentMethod === 'GCASH').length;

    return NextResponse.json({
      products: productSales.map((s: any) => ({
        productId: s.productId,
        productName: s.productName,
        category: s.category,
        quantity: s._sum.quantity ?? 0,
        total: s._sum.total ?? 0,
      })),
      categories: categorySales.map((c: any) => ({
        category: c.category || 'Uncategorized',
        quantity: c._sum.quantity ?? 0,
        total: c._sum.total ?? 0,
      })),
      statistics: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        totalItemsSold: productSales.reduce((sum, s) => sum + (s._sum.quantity ?? 0), 0),
        codOrders,
        gcashOrders,
      },
    });
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 }
    );
  }
}
