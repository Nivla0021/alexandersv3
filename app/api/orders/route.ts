// /api/orders/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendOrderConfirmationEmail } from '@/lib/email';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, customerPhone, deliveryAddress, orderNotes, items, paymentMethod, userId } = body;

    if (!customerName || !customerEmail || !customerPhone || !deliveryAddress || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 0), 0);
    const total = subtotal;
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create pending order in DB immediately
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: userId || null, // Optional - link to user if authenticated
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        orderNotes,
        subtotal,
        total,
        orderStatus: 'pending',
        paymentStatus: paymentMethod === 'COD' ? 'unpaid' : 'unpaid',
        paymentMethod,
        orderItems: { create: items.map((item: any) => ({ productId: item.id, quantity: item.quantity, price: item.price })) },
      },
      include: { orderItems: { include: { product: true } } },
    });

    // If COD, send email and return immediately
    if (paymentMethod === 'COD') {
      // Send order confirmation email
      const emailItems = order.orderItems.map((item: any) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.price,
        quantity: item.quantity,
      }));

      await sendOrderConfirmationEmail({
        customerName,
        customerEmail,
        orderNumber,
        items: emailItems,
        subtotal,
        total,
        paymentMethod: 'COD',
      }).catch(err => console.error('Email error:', err));

      return NextResponse.json({ order }, { status: 201 });
    }

    // GCash / PayMongo: create checkout session
    const line_items = items.map((item: any) => ({
      name: item.name || 'Item',
      description: item.name || 'Item description',
      amount: Math.round((item.price || 0) * 100),
      currency: 'PHP',
      quantity: item.quantity || 1,
    }));

    const paymongoRes = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString('base64'),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: { name: customerName, email: customerEmail, phone: customerPhone },
            send_email_receipt: true,
            show_description: false,
            payment_method_types: ['gcash'],
            line_items,
            metadata: {
              order_number: orderNumber
            },
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?order=${orderNumber}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-cancelled?order=${orderNumber}`,
          },
        },
      }),
    });

    const paymongoData = await paymongoRes.json();
    console.log('PayMongo response:', JSON.stringify(paymongoData, null, 2));

    if (!paymongoData?.data?.attributes?.checkout_url) {
      return NextResponse.json({ error: 'Failed to generate GCash checkout link', details: paymongoData }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl: paymongoData.data.attributes.checkout_url, orderNumber }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
