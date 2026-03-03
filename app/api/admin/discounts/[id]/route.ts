import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { sendDiscountApprovalEmail, sendDiscountRejectionEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const application = await prisma.discountApproval.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        order: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(application);

  } catch (error: any) {
    console.error('Error fetching discount application:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch discount application' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { action, rejectionReason } = await req.json();

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const application = await prisma.discountApproval.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json({ error: 'This application has already been processed' }, { status: 400 });
    }

    // Start a transaction to update both the application and the user
    const result = await prisma.$transaction(async (tx) => {
      // Update the application
      const updatedApplication = await tx.discountApproval.update({
        where: { id },
        data: {
          status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          isApproved: action === 'APPROVE',
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          ...(action === 'REJECT' && rejectionReason ? { rejectionReason } : {}),
        },
      });

      // If approved, update the user's discount status (ONE-TIME APPROVAL)
      if (action === 'APPROVE') {
        await tx.user.update({
          where: { id: application.userId },
          data: {
            discountApproved: true,
            discountType: application.discountType,
            discountApprovedAt: new Date(),
            discountReviewedBy: session.user.id,
          },
        });
      }

      return updatedApplication;
    });

    // Send email notification based on action
    try {
      if (action === 'APPROVE') {
        await sendDiscountApprovalEmail({
          to: application.user.email,
          userName: application.user.name || 'Valued Customer',
          discountType: application.discountType || undefined,
          applicationId: id,
        });
      } else {
        await sendDiscountRejectionEmail({
          to: application.user.email,
          userName: application.user.name || 'Valued Customer',
          discountType: application.discountType || undefined,
          rejectionReason: rejectionReason,
          applicationId: id,
        });
      }
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('Failed to send notification email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: action === 'APPROVE' 
        ? 'Discount application approved. User will now automatically get discount on all future orders.' 
        : 'Discount application rejected.',
      application: result,
    });

  } catch (error: any) {
    console.error('Error updating discount application:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update discount application' },
      { status: 500 }
    );
  }
}