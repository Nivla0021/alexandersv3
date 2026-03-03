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

    // Fetch without order relation first
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
          // Comment out order for now to test
          // order: {
          //   select: {
          //     id: true,
          //     orderNumber: true,
          //     total: true,
          //     createdAt: true,
          //   },
          // },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.discountApproval.count({ where }),
    ]);

    // If you need order information, you can fetch it separately
    const applicationsWithOrders = await Promise.all(
      applications.map(async (app) => {
        if (app.orderId) {
          const order = await prisma.order.findUnique({
            where: { id: app.orderId },
            select: {
              id: true,
              orderNumber: true,
              total: true,
              createdAt: true,
            },
          });
          return { ...app, order };
        }
        return { ...app, order: null };
      })
    );

    return NextResponse.json({
      applications: applicationsWithOrders,
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