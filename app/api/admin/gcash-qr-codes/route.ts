// app/api/admin/gcash-qr-codes/route.ts
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const qrCodes = await prisma.gCashQRCode.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(qrCodes);
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QR codes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, imageUrl, isActive, amount, description } = body;

    if (!name || !imageUrl) {
      return NextResponse.json(
        { error: 'Name and image URL are required' },
        { status: 400 }
      );
    }

    // If setting this as active, deactivate all others
    if (isActive) {
      await prisma.gCashQRCode.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    const qrCode = await prisma.gCashQRCode.create({
      data: {
        name,
        imageUrl,
        isActive: isActive || false,
        amount: amount || null,
        description: description || null,
      }
    });

    return NextResponse.json(qrCode, { status: 201 });
  } catch (error) {
    console.error('Error creating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to create QR code' },
      { status: 500 }
    );
  }
}