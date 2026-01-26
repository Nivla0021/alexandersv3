import nodemailer from 'nodemailer';

interface OrderItem {
  id: string;
  name: string;
  variantLabel?: string; // ✅ ADD THIS
  price: number;
  quantity: number;
}
interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
}

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  try {
    // Build items table HTML
    const itemsHTML = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 14px 12px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: 600; color: #1f2937;">
              ${item.name}
            </div>

            ${
              item.variantLabel
                ? `<div style="margin-top:2px;font-size:12px;color:#6b7280;">
                    ${item.variantLabel}
                  </div>`
                : ''
            }
          </td>

          <td style="padding: 14px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            ${item.quantity}
          </td>

          <td style="padding: 14px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ₱${item.price.toFixed(2)}
          </td>

          <td style="padding: 14px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
            ₱${(item.price * item.quantity).toFixed(2)}
          </td>
        </tr>
      `
    )
    .join('');

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - Alexander's Cuisine</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table width="600" style="max-width:100%;background:#ffffff;border-radius:10px;box-shadow:0 4px 10px rgba(0,0,0,0.05);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#d97706,#b45309);padding:35px 30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;">Thank You for Your Order!</h1>
              <p style="margin:8px 0 0;color:#fde68a;font-size:15px;">Alexander's Handcrafted Cuisine</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:30px;">
              <p style="margin:0;font-size:16px;color:#374151;">
                Hi <strong>${data.customerName}</strong>,
              </p>
              <p style="margin:12px 0 0;font-size:16px;color:#374151;">
                Thank you for ordering from <strong>Alexander's Handcrafted Cuisine</strong>! Below are your order details:
              </p>
            </td>
          </tr>

          <!-- Order Info -->
          <tr>
            <td style="padding:0 30px;">
              <div style="background:#fef3c7;border-left:4px solid #d97706;padding:14px 18px;border-radius:6px;">
                <p style="margin:0;font-size:14px;color:#92400e;">
                  <strong>Order Number:</strong> ${data.orderNumber}
                </p>
                <p style="margin:6px 0 0;font-size:14px;color:#92400e;">
                  <strong>Payment Method:</strong> ${data.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'GCash (Paid)'}
                </p>
              </div>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding:30px;">
              <h2 style="margin:0 0 15px;font-size:20px;color:#1f2937;">Order Summary</h2>
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
                <thead>
                  <tr style="background:#f9fafb;">
                    <th style="padding:12px;text-align:left;font-size:13px;color:#6b7280;border-bottom:2px solid #e5e7eb;">Item</th>
                    <th style="padding:12px;text-align:center;font-size:13px;color:#6b7280;border-bottom:2px solid #e5e7eb;">Qty</th>
                    <th style="padding:12px;text-align:right;font-size:13px;color:#6b7280;border-bottom:2px solid #e5e7eb;">Price</th>
                    <th style="padding:12px;text-align:right;font-size:13px;color:#6b7280;border-bottom:2px solid #e5e7eb;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                  <tr>
                    <td colspan="3" style="padding:16px 12px;text-align:right;font-size:18px;font-weight:700;color:#1f2937;border-top:2px solid #d97706;">
                      Total
                    </td>
                    <td style="padding:16px 12px;text-align:right;font-size:18px;font-weight:800;color:#d97706;border-top:2px solid #d97706;">
                      ₱${data.total.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Delivery Info -->
          <tr>
            <td style="padding:0 30px 30px;">
              <div style="background:#f3f4f6;padding:18px;border-radius:6px;">
                <h3 style="margin:0 0 8px;font-size:16px;color:#1f2937;">📦 What's Next?</h3>
                <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">
                  ${data.paymentMethod === 'COD'
                    ? 'Your order will be prepared and delivered soon. Please prepare the exact amount for payment.'
                    : 'Your payment has been confirmed! Your order will now be prepared for delivery.'}
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 30px 40px;text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}"
                 style="display:inline-block;background:#d97706;color:#fff;text-decoration:none;padding:14px 34px;border-radius:6px;font-size:16px;font-weight:600;">
                Order Again →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:13px;color:#6b7280;">
                <strong>Alexander's Handcrafted Cuisine</strong>
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#9ca3af;">
                📧 sales@avasiaonline.com | 🌐 ${process.env.NEXT_PUBLIC_BASE_URL}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: `"Alexander's Cuisine" <${process.env.SMTP_USER}>`,
      to: data.customerEmail,
      subject: `Order Confirmation - ${data.orderNumber}`,
      html: htmlContent,
    });

    console.log('✅ Order confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error);
    return false;
  }
}
