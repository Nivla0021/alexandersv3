export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendOrderConfirmationEmail } from '@/lib/email';

import { prisma } from "@/lib/prisma";
const WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    /**
     * 1️⃣ Read RAW body (required for signature verification)
     */
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    /**
     * 2️⃣ Verify PayMongo signature (optional if secret not configured)
     */
    const signatureHeader = req.headers.get('paymongo-signature');

    if (WEBHOOK_SECRET) {
      // Only verify signature if webhook secret is configured
      if (!signatureHeader || !verifySignature(signatureHeader, rawBody, WEBHOOK_SECRET)) {
        console.error('❌ Invalid PayMongo webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('✅ Webhook signature verified');
    } else {
      console.warn('⚠️ Webhook secret not configured - skipping signature verification');
    }

    /**
     * 3️⃣ Extract event info
     */
    const eventType = payload?.data?.attributes?.type;
    const data = payload?.data?.attributes?.data;

    console.log(`📦 Event type: ${eventType}`);

    /**
     * 4️⃣ Extract order number from metadata
     */
    let orderNumber: string | null = null;

    // Checkout Session metadata
    if (data?.attributes?.metadata?.order_number) {
      orderNumber = data.attributes.metadata.order_number;
    }

    // Payment metadata (GCash)
    if (!orderNumber && data?.attributes?.source?.metadata?.order_number) {
      orderNumber = data.attributes.source.metadata.order_number;
    }

    if (!orderNumber) {
      console.log('ℹ️ Webhook has no order number, skipping DB update');
      return NextResponse.json({ received: true });
    }

    console.log(`🧾 Order Number: ${orderNumber}`);

    /**
     * 5️⃣ Handle events
     */
    if (eventType === 'checkout_session.payment.paid') {
      // Fetch order with items before updating
      const orderWithItems = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!orderWithItems) {
        console.error(`❌ Order ${orderNumber} not found for email`);
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Update order status
      await prisma.order.update({
        where: { orderNumber },
        data: {
          paymentStatus: 'paid',
          orderStatus: 'confirmed',
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Order ${orderNumber} marked as PAID`);

      // Send order confirmation email
      const emailItems = orderWithItems.orderItems.map((item: any) => ({
        id: item.product.id,
        name: item.variantLabel
          ? `${item.product.name} (${item.variantLabel})`
          : item.product.name,
        price: item.price,
        quantity: item.quantity,
      }));

      await sendOrderConfirmationEmail({
        customerName: orderWithItems.customerName,
        customerEmail: orderWithItems.customerEmail,
        orderNumber: orderWithItems.orderNumber,
        items: emailItems,
        subtotal: orderWithItems.subtotal,
        total: orderWithItems.total,
        paymentMethod: 'GCash',
      }).catch(err => console.error('📧 Email error:', err));

      console.log(`📧 Order confirmation email sent to ${orderWithItems.customerEmail}`);
    }

    if (eventType === 'payment.failed') {
      await prisma.order.update({
        where: { orderNumber },
        data: {
          paymentStatus: 'failed',
          orderStatus: 'cancelled',
          updatedAt: new Date(),
        },
      });

      console.log(`❌ Order ${orderNumber} marked as FAILED`);
    }
    console.log('Headers received:', Object.fromEntries(req.headers.entries()));

    /**
     * 6️⃣ Always acknowledge webhook
     */
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);

    // Important: still return 200 to avoid retries
    return NextResponse.json({ success: false }, { status: 200 });
  }
}


/**
 * 🔐 PayMongo Signature Verification
 * Format: t=timestamp,v1=signature
 */
function verifySignature(header: string, payload: string, secret: string): boolean {
  try {
    console.log('🔐 Raw PayMongo signature header:', header);

    const parts = header.split(',');

    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('te='));

    if (!timestampPart || !signaturePart) {
      console.error('❌ Missing t= or te= in signature header');
      return false;
    }

    const timestamp = timestampPart.replace('t=', '');
    const signature = signaturePart.replace('te=', '');

    const signedPayload = `${timestamp}.${payload}`;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    const sig = Uint8Array.from(Buffer.from(signature, 'hex'));
    const expected = Uint8Array.from(Buffer.from(expectedSignature, 'hex'));

    if (sig.length !== expected.length) {
      console.error('❌ Signature length mismatch');
      return false;
    }

    return crypto.timingSafeEqual(sig, expected);
  } catch (error) {
    console.error('❌ PayMongo signature verification failed:', error);
    return false;
  }
}


