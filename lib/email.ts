import nodemailer from 'nodemailer';

interface OrderItem {
  id: string;
  name: string;
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
  secure: false, // true for 465, false for other ports
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
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${item.price.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">₱${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    // Email HTML template
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - Alexander's Cuisine</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Thank You for Your Order!</h1>
              <p style="margin: 10px 0 0; color: #fef3c7; font-size: 16px;">Alexander's Handcrafted Cuisine</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">
                Hi <strong>${data.customerName}</strong>,
              </p>
              <p style="margin: 15px 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
                Thank you for ordering from <strong>Alexander's Handcrafted Cuisine</strong>! We're excited to prepare your delicious Filipino food.
              </p>
            </td>
          </tr>

          <!-- Order Details -->
          <tr>
            <td style="padding: 0 30px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 15px 20px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>Order Number:</strong> ${data.orderNumber}
                </p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #92400e;">
                  <strong>Payment Method:</strong> ${data.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'GCash (Paid)'}
                </p>
              </div>
            </td>
          </tr>

          <!-- Order Items Table -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <h2 style="margin: 0 0 20px; font-size: 20px; color: #1f2937; font-weight: 600;">Order Summary</h2>
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 4px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-size: 14px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Item</th>
                    <th style="padding: 12px; text-align: center; font-size: 14px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Qty</th>
                    <th style="padding: 12px; text-align: right; font-size: 14px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Price</th>
                    <th style="padding: 12px; text-align: right; font-size: 14px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                  <tr>
                    <td colspan="3" style="padding: 16px 12px; text-align: right; font-weight: 600; font-size: 18px; color: #1f2937; border-top: 2px solid #d97706;">
                      Total Amount:
                    </td>
                    <td style="padding: 16px 12px; text-align: right; font-weight: 700; font-size: 18px; color: #d97706; border-top: 2px solid #d97706;">
                      ₱${data.total.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Delivery Info -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 4px;">
                <h3 style="margin: 0 0 10px; font-size: 16px; color: #1f2937;">📦 What's Next?</h3>
                <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
                  ${data.paymentMethod === 'COD' 
                    ? 'Your order will be prepared and delivered soon. Please have the exact amount ready for payment upon delivery.' 
                    : 'Your payment has been confirmed! Your order will be prepared and delivered soon.'}
                </p>
                <p style="margin: 10px 0 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
                  We deliver to <strong>Metro Manila only</strong>. You can track your order status by logging into your account or contacting us directly.
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 40px; text-align: center;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">
                Craving for more delicious Filipino food?
              </p>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; transition: background-color 0.3s;">
                Order More Here →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                <strong>Alexander's Handcrafted Cuisine</strong>
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">
                📧 sales@avasiaonline.com | 🌐 <a href="${process.env.NEXT_PUBLIC_BASE_URL}" style="color: #d97706; text-decoration: none;">${process.env.NEXT_PUBLIC_BASE_URL}</a>
              </p>
              <p style="margin: 12px 0 0; font-size: 12px; color: #9ca3af;">
                Serving authentic Filipino cuisine to Metro Manila
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

    // Send email
    const info = await transporter.sendMail({
      from: `"Alexander's Cuisine" <${process.env.SMTP_USER}>`,
      to: data.customerEmail,
      subject: `Order Confirmation - ${data.orderNumber} | Alexander's Cuisine`,
      html: htmlContent,
    });

    console.log('✅ Order confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error);
    return false;
  }
}
