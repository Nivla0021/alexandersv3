//app/api/admin/discounts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status !== 'ALL') {
      where.status = status;
    }

    // ✅ FIXED: Include orders relation directly in the query
    const [applications, total] = await Promise.all([
      prisma.discountApproval.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          orders: { // ✅ Correct relation name from schema (plural)
            select: {
              id: true,
              orderNumber: true,
              total: true,
              createdAt: true,
            },
            take: 1, // Only need the most recent order if multiple exist
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.discountApproval.count({ where }),
    ]);

    // ✅ Transform the data to include the first order if it exists
    const applicationsWithOrder = applications.map((app) => ({
      ...app,
      order: app.orders && app.orders.length > 0 ? app.orders[0] : null,
      // Remove the orders array if you don't need it in the response
      orders: undefined,
    }));

    return NextResponse.json({
      applications: applicationsWithOrder,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error: any) {
    console.error('Error fetching discount applications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch discount applications' },
      { status: 500 }
    );
  }
}