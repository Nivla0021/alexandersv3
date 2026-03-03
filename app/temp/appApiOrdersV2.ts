// /api/orders/route.ts
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

function random4() {
  return Math.floor(1000 + Math.random() * 9000);
}

function generateOrderNumber(orderSource: string, orderMode?: string | null) {
  const rnd = random4();

  if (orderSource === 'ONLINE') return `ONL-${rnd}`;
  if (orderSource === 'KIOSK') {
    if (orderMode === 'DINE-IN') return `SDI-${rnd}`;
    if (orderMode === 'TAKEOUT') return `STO-${rnd}`;
  }
  return `GEN-${rnd}`; // fallback
}

function generateTransactionNumber() {
  const today = new Date().toISOString().slice(0,10).replace(/-/g,''); // YYYYMMDD
  const rnd = Math.floor(10000 + Math.random() * 90000); // 5 digits
  return `${today}${rnd}`;
}

export async function POST(request: Request) {
  try {
      const body = await request.json();

      const {
        orderSource = 'ONLINE',
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        orderNotes,
        items,
        paymentMethod,
        userId, // This is the user ID from the session
        deliveryFee = 0,
        subtotal = 0,
        total = 0,
        deliveryZipCode,
        userLocationData,
      } = body;

      // Validation
      if (!items?.length) {
        return NextResponse.json(
          { error: 'Order must contain at least one item' },
          { status: 400 }
        );
      }

      if (orderSource === 'ONLINE') {
        if (!customerName || !customerEmail || !customerPhone || !deliveryAddress) {
          return NextResponse.json(
            { error: 'Missing required customer fields' },
            { status: 400 }
          );
        }
      }

      // Calculate totals if not provided (for backward compatibility)
      const calculatedSubtotal = subtotal || items.reduce(
        (sum: number, item: any) =>
          sum + (item.price || 0) * (item.quantity || 0),
        0
      );

      const calculatedTotal = total || (calculatedSubtotal + (deliveryFee || 0));

      const orderNumber = generateOrderNumber(orderSource, body.orderMode);
      const transactionNumber = generateTransactionNumber();

      // Determine payment status based on method
      let paymentStatus = 'unpaid';
      let orderStatus = 'pending';
      
      if (paymentMethod === 'COD') {
        paymentStatus = 'unpaid';
        orderStatus = 'pending';
      } else if (paymentMethod === 'GCASH') {
        paymentStatus = 'awaiting_payment';
        orderStatus = 'pending';
      }else if (paymentMethod === 'CASH') {
        paymentStatus = 'unpaid';
        orderStatus = 'confirmed';
      }

      // Build the order data object
      const orderData: any = {
        orderNumber,
        orderSource,
        transactionNumber,
        orderMode: orderSource === 'KIOSK' ? body.orderMode : null,

        customerName: orderSource === 'KIOSK' ? 'Walk-in' : customerName,
        customerEmail: orderSource === 'KIOSK' ? null : customerEmail,
        customerPhone: orderSource === 'KIOSK' ? null : customerPhone,
        deliveryAddress: orderSource === 'KIOSK' ? null : deliveryAddress,

        orderNotes,
        subtotal: calculatedSubtotal,
        total: calculatedTotal,
        deliveryFee: deliveryFee || 0,
        orderStatus,
        paymentStatus,
        paymentMethod,

        // Store additional delivery info
        deliveryZipCode: deliveryZipCode || null,
        locationData: userLocationData ? JSON.stringify(userLocationData) : null,

        orderItems: {
          create: items.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,

            // 🔹 VARIANT SUPPORT
            variantId: item.variantId || null,
            variantLabel: item.variantLabel || null,
          })),
        },
      };

      // Add user relation if userId is provided
      if (userId) {
        orderData.user = {
          connect: {
            id: userId
          }
        };
      }

      // 🔹 Create order with variant fields
      const order = await prisma.order.create({
        data: orderData,
        include: {
          orderItems: {
            include: { product: true },
          },
          user: true, // Include user data if needed
        },
      });

      // KIOSK
      if (orderSource === 'KIOSK') {
        return NextResponse.json({ order }, { status: 201 });
      }

      // ONLINE COD - Send email immediately
      if (paymentMethod === 'COD') {
        const emailItems = order.orderItems.map((item: any) => ({
          id: item.product.id,
          name: item.variantLabel
            ? `${item.product.name} (${item.variantLabel})`
            : item.product.name,
          price: item.price,
          quantity: item.quantity,
          variantLabel: item.variantLabel,
        }));

        await sendOrderConfirmationEmail({
          customerName,
          customerEmail,
          orderNumber,
          items: emailItems,
          subtotal: calculatedSubtotal,
          total: calculatedTotal,
          deliveryFee: deliveryFee || 0,
          paymentMethod: 'COD',
        }).catch((err) => console.error('Email error:', err));

        return NextResponse.json({ order }, { status: 201 });
      }

      // ONLINE GCash QR Code - Don't send email yet, wait for payment
      if (paymentMethod === 'GCASH') {
        // Return order without sending email
        return NextResponse.json({ 
          order,
          requiresGcashPayment: true,
          gcashInstructions: {
            amount: calculatedTotal,
            orderNumber: order.orderNumber,
          }
        }, { status: 201 });
      }

      // Fallback for other payment methods
      return NextResponse.json({ order }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}