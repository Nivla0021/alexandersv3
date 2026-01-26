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
        userId,
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

      // 🔹 Calculate totals safely using variant prices
      const subtotal = items.reduce(
        (sum: number, item: any) =>
          sum + (item.price || 0) * (item.quantity || 0),
        0
      );

      const total = subtotal;

      const orderNumber = generateOrderNumber(orderSource, body.orderMode);
      const transactionNumber = generateTransactionNumber();

      // 🔹 Create order with variant fields
      const order = await prisma.order.create({
        data: {
          orderNumber,
          orderSource,
          transactionNumber,
          orderMode: orderSource === 'KIOSK' ? body.orderMode : null,
          userId: userId || null,

          customerName: orderSource === 'KIOSK' ? 'Walk-in' : customerName,
          customerEmail: orderSource === 'KIOSK' ? null : customerEmail,
          customerPhone: orderSource === 'KIOSK' ? null : customerPhone,
          deliveryAddress: orderSource === 'KIOSK' ? null : deliveryAddress,

          orderNotes,
          subtotal,
          total,
          orderStatus: orderSource === 'KIOSK' ? 'confirmed' : 'pending',
          paymentStatus:
            orderSource === 'KIOSK' ? 'unpaid' : paymentMethod === 'COD' ? 'unpaid' : 'unpaid',
          paymentMethod,

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
        },
        include: {
          orderItems: {
            include: { product: true },
          },
        },
      });

      // KIOSK
      if (orderSource === 'KIOSK') {
        return NextResponse.json({ order }, { status: 201 });
      }

    // ONLINE COD
    if (paymentMethod === 'COD') {
      const emailItems = order.orderItems.map((item: any) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.price,
        quantity: item.quantity,
        variantLabel: item.variantLabel, // 🔹 include variant
      }));

      await sendOrderConfirmationEmail({
        customerName,
        customerEmail,
        orderNumber,
        items: emailItems,
        subtotal,
        total,
        paymentMethod: 'COD',
      }).catch((err) => console.error('Email error:', err));

      return NextResponse.json({ order }, { status: 201 });
    }

    // ONLINE GCash / PayMongo
    const line_items = items.map((item: any) => ({
      name: item.variantLabel
        ? `${item.name} (${item.variantLabel})`
        : item.name || 'Item',

      description: item.variantLabel
        ? `Variant: ${item.variantLabel}`
        : item.name || 'Item description',

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
              order_number: orderNumber,
              items: JSON.stringify(
                items.map((i: any) => ({
                  productId: i.id,
                  variantId: i.variantId,
                  variantLabel: i.variantLabel,
                  quantity: i.quantity,
                  price: i.price,
                }))
              ),
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
      return NextResponse.json(
        { error: 'Failed to generate GCash checkout link', details: paymongoData },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { checkoutUrl: paymongoData.data.attributes.checkout_url, orderNumber },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
