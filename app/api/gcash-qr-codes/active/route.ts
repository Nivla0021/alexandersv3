// app/api/gcash-qr-codes/active/route.ts
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Find the active QR code
    const activeQRCode = await prisma.gCashQRCode.findFirst({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        description: true,
        amount: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!activeQRCode) {
      // Return a 200 with null qrCode instead of 404 to handle gracefully on frontend
      return NextResponse.json({
        success: true,
        qrCode: null,
        message: 'No active QR code found'
      });
    }

    return NextResponse.json({
      success: true,
      qrCode: activeQRCode
    });

  } catch (error) {
    console.error('Error fetching active QR code:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch active QR code' 
      },
      { status: 500 }
    );
  }
}