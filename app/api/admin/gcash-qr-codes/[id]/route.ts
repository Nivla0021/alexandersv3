// app/api/admin/gcash-qr-codes/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, imageUrl, isActive, amount, description } = body;

    // If setting this as active, deactivate all others
    if (isActive) {
      await prisma.gCashQRCode.updateMany({
        where: { 
          isActive: true,
          NOT: { id: params.id }
        },
        data: { isActive: false }
      });
    }

    const qrCode = await prisma.gCashQRCode.update({
      where: { id: params.id },
      data: {
        name,
        imageUrl,
        isActive,
        amount: amount || null,
        description: description || null,
      }
    });

    return NextResponse.json(qrCode);
  } catch (error) {
    console.error('Error updating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to update QR code' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.gCashQRCode.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting QR code:', error);
    return NextResponse.json(
      { error: 'Failed to delete QR code' },
      { status: 500 }
    );
  }
}