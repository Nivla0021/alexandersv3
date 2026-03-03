// /api/orders/gcash-verify/route.ts
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Check content type to determine how to parse the request
    const contentType = request.headers.get('content-type') || '';
    
    let orderId: string | null = null;
    let orderNumber: string | null = null;
    let gcashReference: string | null = null;
    let receiptFile: File | null = null;
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with file upload)
      const formData = await request.formData();
      orderId = formData.get('orderId') as string;
      orderNumber = formData.get('orderNumber') as string;
      gcashReference = formData.get('gcashReference') as string;
      receiptFile = formData.get('receipt') as File | null;
    } else {
      // Handle JSON (for backward compatibility)
      const body = await request.json();
      orderId = body.orderId;
      orderNumber = body.orderNumber;
      gcashReference = body.gcashReference;
    }
    
    // Validate required fields
    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { error: 'Order ID or Order Number is required' },
        { status: 400 }
      );
    }
    
    if (!gcashReference) {
      return NextResponse.json(
        { error: 'GCash reference number is required' },
        { status: 400 }
      );
    }

    // Validate file if present (for FormData submissions)
    if (receiptFile) {
      // Check if it's an image
      if (!receiptFile.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'File must be an image (JPEG, PNG, etc.)' },
          { status: 400 }
        );
      }

      // Check file size (max 5MB)
      if (receiptFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size must be less than 5MB' },
          { status: 400 }
        );
      }
    } else if (contentType.includes('multipart/form-data')) {
      // If it's a FormData submission but no file, return error
      return NextResponse.json(
        { error: 'Payment receipt image is required' },
        { status: 400 }
      );
    }
    
    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { orderNumber: orderNumber }
        ]
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: 'Order is already paid' },
        { status: 400 }
      );
    }

    // Check if order already has a pending verification
    if (order.paymentStatus === 'verifying') {
      return NextResponse.json(
        { error: 'This order already has a pending payment verification' },
        { status: 400 }
      );
    }

    let receiptUrl = null;

    // Save the receipt file if provided
    if (receiptFile) {
      try {
        const bytes = await receiptFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const timestamp = Date.now();
        const fileExtension = path.extname(receiptFile.name) || '.jpg';
        const filename = `gcash-receipt-${order.orderNumber}-${timestamp}${fileExtension}`;
        
        // Define upload directory
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
        
        // Create directory if it doesn't exist
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }
        
        // Save file
        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);
        
        // Create public URL for the file
        receiptUrl = `/uploads/receipts/${filename}`;
        
        console.log(`Receipt saved: ${receiptUrl}`);
      } catch (fileError) {
        console.error('Error saving receipt file:', fileError);
        return NextResponse.json(
          { error: 'Failed to save receipt file. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    // Prepare update data
    const updateData: any = {
      paymentStatus: 'verifying',
      gcashReference: gcashReference,
      updatedAt: new Date(),
    };

    // Only add receipt URL if we have one
    if (receiptUrl) {
      updateData.gcashReceiptUrl = receiptUrl;
    }
    
    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });
    
    // Log the verification submission
    console.log(`GCash payment submitted for order ${order.orderNumber}`);
    console.log(`Reference: ${gcashReference}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Payment verification submitted. We will process your order once payment is confirmed.',
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        paymentStatus: updatedOrder.paymentStatus,
        gcashReference: updatedOrder.gcashReference,
        receiptUrl: receiptUrl,
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error processing GCash verification:', error);
    
    // Handle JSON parsing errors specifically
    if (error.message?.includes('JSON') || error.name === 'SyntaxError') {
      return NextResponse.json(
        { error: 'Invalid request format. Please try again.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to process payment verification' },
      { status: 500 }
    );
  }
}