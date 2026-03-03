import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'You must be logged in' }, { status: 401 });
    }

    // Check user's discount status (one-time approval)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        discountApproved: true,
        discountType: true,
        discountApprovedAt: true,
      },
    });

    // If user is already approved, return that
    if (user?.discountApproved) {
      return NextResponse.json({
        isGloballyApproved: true,
        discountType: user.discountType,
        approvedAt: user.discountApprovedAt,
        status: 'APPROVED',
      });
    }

    // Check if there's a pending application
    const pendingApplication = await prisma.discountApproval.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (pendingApplication) {
      return NextResponse.json({
        isGloballyApproved: false,
        hasPending: true,
        status: 'PENDING',
        appliedAt: pendingApplication.createdAt,
        discountType: pendingApplication.discountType,
      });
    }

    // Get all rejected applications to count attempts
    const rejectedApplications = await prisma.discountApproval.findMany({
      where: {
        userId: session.user.id,
        status: 'REJECTED',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (rejectedApplications.length > 0) {
      // Get the most recent rejected application
      const latestRejected = rejectedApplications[0];
      
      return NextResponse.json({
        isGloballyApproved: false,
        hasRejected: true,
        status: 'REJECTED',
        discountType: latestRejected.discountType,
        applicationCount: rejectedApplications.length,
        latestApplication: {
          rejectionReason: latestRejected.rejectionReason || 'No specific reason provided',
          rejectedAt: latestRejected.reviewedAt || latestRejected.updatedAt,
          createdAt: latestRejected.createdAt,
        },
        allRejections: rejectedApplications.map(app => ({
          id: app.id,
          rejectionReason: app.rejectionReason,
          rejectedAt: app.reviewedAt || app.updatedAt,
          discountType: app.discountType,
        })),
      });
    }

    // Also check for applications with other statuses (just in case)
    const anyApplication = await prisma.discountApproval.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (anyApplication) {
      // This handles cases where there might be an application with a different status
      // (like if you have other statuses besides PENDING, APPROVED, REJECTED)
      return NextResponse.json({
        isGloballyApproved: false,
        hasApplied: true,
        status: anyApplication.status,
        discountType: anyApplication.discountType,
        appliedAt: anyApplication.createdAt,
      });
    }

    // No discount application found
    return NextResponse.json({
      isGloballyApproved: false,
      hasApplied: false,
      status: null,
    });

  } catch (error: any) {
    console.error('Discount status check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check discount status' },
      { status: 500 }
    );
  }
}