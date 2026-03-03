// lib/email.ts
import nodemailer from 'nodemailer';

interface OrderItem {
  id: string;
  name: string;
  variantLabel?: string;
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
  deliveryFee?: number;
}

interface RejectionEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  reason: string;
  total: number;
  gcashReference?: string;
}

// New interface for discount application emails
interface DiscountEmailData {
  to: string;
  userName: string;
  discountType?: string;
  rejectionReason?: string;
  applicationId: string;
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

/**
 * Sends GCash payment rejection email to customer
 */
export async function sendPaymentRejectionEmail(data: RejectionEmailData): Promise<boolean> {
  try {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Issue - Alexander's Cuisine</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table width="600" style="max-width:100%;background:#ffffff;border-radius:10px;box-shadow:0 4px 10px rgba(0,0,0,0.05);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:35px 30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;">Payment Issue Detected</h1>
              <p style="margin:8px 0 0;color:#fecaca;font-size:15px;">Alexander's Handcrafted Cuisine</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:30px;">
              <p style="margin:0;font-size:16px;color:#374151;">
                Hi <strong>${data.customerName}</strong>,
              </p>
              <p style="margin:12px 0 0;font-size:16px;color:#374151;">
                We regret to inform you that there was an issue with your GCash payment for order <strong>#${data.orderNumber}</strong>.
              </p>
            </td>
          </tr>

          <!-- Payment Issue Details -->
          <tr>
            <td style="padding:0 30px;">
              <div style="background:#fee2e2;border-left:4px solid #dc2626;padding:18px;border-radius:6px;margin-bottom:20px;">
                <h3 style="margin:0 0 10px;font-size:18px;color:#991b1b;">⚠️ Payment Issue</h3>
                <div style="margin:12px 0;">
                  <p style="margin:8px 0;font-size:14px;color:#7f1d1d;">
                    <strong>Order Number:</strong> ${data.orderNumber}
                  </p>
                  <p style="margin:8px 0;font-size:14px;color:#7f1d1d;">
                    <strong>Total Amount:</strong> ₱${data.total.toFixed(2)}
                  </p>
                  ${data.gcashReference ? 
                    `<p style="margin:8px 0;font-size:14px;color:#7f1d1d;">
                      <strong>Reference Number:</strong> ${data.gcashReference}
                    </p>` : ''
                  }
                  <p style="margin:8px 0;font-size:14px;color:#7f1d1d;">
                    <strong>Issue:</strong> ${data.reason}
                  </p>
                </div>
              </div>
            </td>
          </tr>

          <!-- What Happened -->
          <tr>
            <td style="padding:0 30px;">
              <div style="background:#f8fafc;padding:20px;border-radius:6px;border:1px solid #e2e8f0;">
                <h3 style="margin:0 0 12px;font-size:16px;color:#1e293b;">What could have happened?</h3>
                <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.6;">
                  <li>Incorrect payment amount sent</li>
                  <li>Payment not received in our GCash account</li>
                  <li>Reference number doesn't match our records</li>
                  <li>Payment was sent to wrong GCash number</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Contact Support -->
          <tr>
            <td style="padding:0 30px 30px;">
              <div style="background:#eff6ff;padding:20px;border-radius:6px;border:1px solid #93c5fd;text-align:center;">
                <h3 style="margin:0 0 12px;font-size:16px;color:#1e40af;">Need Help?</h3>
                <p style="margin:0 0 16px;font-size:14px;color:#1e3a8a;">
                  Contact our support team for assistance:
                </p>
                <div style="display:flex;gap:20px;justify-content:center;">
                  <div style="text-align:center;">
                    <div style="width:40px;height:40px;background:#3b82f6;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
                      <span style="color:white;font-size:18px;">📧</span>
                    </div>
                    <p style="margin:0;font-size:13px;color:#1e3a8a;">
                      Email<br>
                      <strong>${process.env.SMTP_USER || 'sales@avasiaonline.com'}</strong>
                    </p>
                  </div>
                  <div style="text-align:center;">
                    <div style="width:40px;height:40px;background:#3b82f6;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
                      <span style="color:white;font-size:18px;">📱</span>
                    </div>
                    <p style="margin:0;font-size:13px;color:#1e3a8a;">
                      GCash Number<br>
                      <strong>${process.env.NEXT_PUBLIC_GCASH_NUMBER || '0917-XXX-XXXX'}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Action Buttons -->
          <tr>
            <td style="padding:0 30px 40px;text-align:center;">
              <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/checkout?order=${data.orderNumber}"
                   style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
                  View Order Details →
                </a>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}"
                   style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
                   Contact Support →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:13px;color:#6b7280;">
                <strong>Alexander's Handcrafted Cuisine</strong>
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#9ca3af;">
                📧 ${process.env.SMTP_USER || 'sales@avasiaonline.com'} | 🌐 ${process.env.NEXT_PUBLIC_BASE_URL}
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#9ca3af;">
                If you've already resolved this issue, please ignore this email.
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
      from: `"Alexander's Cuisine - Support" <${process.env.SMTP_USER}>`,
      to: data.customerEmail,
      subject: `Payment Issue - Order #${data.orderNumber}`,
      html: htmlContent,
    });

    console.log('✅ Payment rejection email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send payment rejection email:', error);
    return false;
  }
}

/**
 * Sends discount approval email to customer
 */
export async function sendDiscountApprovalEmail(data: DiscountEmailData): Promise<boolean> {
  try {
    const discountTypeDisplay = data.discountType?.replace(/_/g, ' ') || 'Special';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Discount Application Approved - Alexander's Cuisine</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table width="600" style="max-width:100%;background:#ffffff;border-radius:10px;box-shadow:0 4px 10px rgba(0,0,0,0.05);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669,#047857);padding:35px 30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:32px;">🎉 Congratulations!</h1>
              <p style="margin:8px 0 0;color:#a7f3d0;font-size:16px;">Your Discount Application Has Been Approved</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px;">
              <p style="margin:0 0 15px;font-size:16px;color:#374151;">
                Dear <strong>${data.userName}</strong>,
              </p>
              
              <p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.6;">
                Great news! Your application for a <strong style="color:#059669;">${discountTypeDisplay}</strong> discount has been approved.
              </p>

              <!-- Benefits Box -->
              <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:20px;margin:20px 0;">
                <h3 style="margin:0 0 15px;font-size:18px;color:#065f46;">✨ What This Means For You:</h3>
                <table width="100%" style="margin-bottom:10px;">
                  <tr>
                    <td width="30" style="padding:5px 0;vertical-align:top;">✅</td>
                    <td style="padding:5px 0;color:#065f46;font-size:15px;">
                      <strong>Automatic Discounts:</strong> Your discount will be applied automatically at checkout on all future orders
                    </td>
                  </tr>
                  <tr>
                    <td width="30" style="padding:5px 0;vertical-align:top;">✅</td>
                    <td style="padding:5px 0;color:#065f46;font-size:15px;">
                      <strong>Permanent Benefit:</strong> This is a one-time approval - no need to reapply
                    </td>
                  </tr>
                  <tr>
                    <td width="30" style="padding:5px 0;vertical-align:top;">✅</td>
                    <td style="padding:5px 0;color:#065f46;font-size:15px;">
                      <strong>Valid for All Orders:</strong> Use your discount on any product from our menu
                    </td>
                  </tr>
                </table>
              </div>

              <!-- How It Works -->
              <div style="background:#f3f4f6;border-radius:8px;padding:20px;margin:20px 0;">
                <h3 style="margin:0 0 12px;font-size:16px;color:#1f2937;">📝 How to Use Your Discount:</h3>
                <ol style="margin:0;padding-left:20px;color:#4b5563;font-size:14px;line-height:1.8;">
                  <li>Simply browse our menu and add items to your cart</li>
                  <li>Proceed to checkout as usual</li>
                  <li>Your ${discountTypeDisplay} discount will be applied automatically</li>
                  <li>Review the discounted total before placing your order</li>
                </ol>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin:30px 0 20px;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/menu"
                   style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 6px rgba(5,150,105,0.25);">
                  🍽️ Start Shopping Now
                </a>
              </div>

              <!-- Support Note -->
              <div style="border-top:1px solid #e5e7eb;margin-top:30px;padding-top:20px;">
                <p style="margin:0;font-size:14px;color:#6b7280;">
                  If you have any questions about your discount or need assistance with your order, 
                  please don't hesitate to contact our support team.
                </p>
              </div>

              <p style="margin:25px 0 0;font-size:15px;color:#374151;">
                Best regards,<br>
                <strong>The Alexander's Cuisine Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:13px;color:#6b7280;">
                <strong>Alexander's Handcrafted Cuisine</strong>
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#9ca3af;">
                📧 ${process.env.SMTP_USER || 'sales@avasiaonline.com'} | 🌐 ${process.env.NEXT_PUBLIC_BASE_URL}
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#9ca3af;">
                Application ID: ${data.applicationId}
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

    const textContent = `
🎉 Congratulations! Your Discount Application Has Been Approved!

Dear ${data.userName},

Great news! Your application for a ${discountTypeDisplay} discount has been approved.

✨ What This Means For You:
✅ Automatic Discounts: Your discount will be applied automatically at checkout on all future orders
✅ Permanent Benefit: This is a one-time approval - no need to reapply
✅ Valid for All Orders: Use your discount on any product from our menu

📝 How to Use Your Discount:
1. Simply browse our menu and add items to your cart
2. Proceed to checkout as usual
3. Your ${discountTypeDisplay} discount will be applied automatically
4. Review the discounted total before placing your order

Start shopping now: ${process.env.NEXT_PUBLIC_BASE_URL}/menu

If you have any questions about your discount or need assistance with your order, 
please don't hesitate to contact our support team.

Best regards,
The Alexander's Cuisine Team

---
Application ID: ${data.applicationId}
    `;

    const info = await transporter.sendMail({
      from: `"Alexander's Cuisine - Discounts" <${process.env.SMTP_USER}>`,
      to: data.to,
      subject: `🎉 Discount Application Approved - Alexander's Cuisine`,
      html: htmlContent,
      text: textContent,
    });

    console.log('✅ Discount approval email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send discount approval email:', error);
    return false;
  }
}

/**
 * Sends discount rejection email to customer
 */
export async function sendDiscountRejectionEmail(data: DiscountEmailData): Promise<boolean> {
  try {
    const discountTypeDisplay = data.discountType?.replace(/_/g, ' ') || 'Special';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Discount Application Status - Alexander's Cuisine</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table width="600" style="max-width:100%;background:#ffffff;border-radius:10px;box-shadow:0 4px 10px rgba(0,0,0,0.05);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6b7280,#4b5563);padding:35px 30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;">Application Status Update</h1>
              <p style="margin:8px 0 0;color:#e5e7eb;font-size:16px;">Regarding Your Discount Request</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px;">
              <p style="margin:0 0 15px;font-size:16px;color:#374151;">
                Dear <strong>${data.userName}</strong>,
              </p>
              
              <p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.6;">
                Thank you for your interest in our <strong>${discountTypeDisplay}</strong> discount program.
              </p>

              <p style="margin:0 0 20px;font-size:16px;color:#374151;">
                After careful review, we regret to inform you that we are unable to approve your discount application at this time.
              </p>

              ${data.rejectionReason ? `
              <!-- Rejection Reason -->
              <div style="background:#fee2e2;border-left:4px solid #ef4444;padding:18px;border-radius:6px;margin:20px 0;">
                <h3 style="margin:0 0 8px;font-size:16px;color:#991b1b;">📋 Reason for this decision:</h3>
                <p style="margin:0;font-size:15px;color:#7f1d1d;line-height:1.6;">
                  ${data.rejectionReason}
                </p>
              </div>
              ` : ''}

              <!-- Next Steps -->
              <div style="background:#f3f4f6;border-radius:8px;padding:20px;margin:20px 0;">
                <h3 style="margin:0 0 15px;font-size:18px;color:#1f2937;">💡 What You Can Do Next:</h3>
                <table width="100%">
                  <tr>
                    <td width="35" style="padding:6px 0;vertical-align:top;">📋</td>
                    <td style="padding:6px 0;color:#4b5563;font-size:15px;">
                      Review and update your application information
                    </td>
                  </tr>
                  <tr>
                    <td width="35" style="padding:6px 0;vertical-align:top;">📞</td>
                    <td style="padding:6px 0;color:#4b5563;font-size:15px;">
                      Contact our support team for clarification
                    </td>
                  </tr>
                  <tr>
                    <td width="35" style="padding:6px 0;vertical-align:top;">🔄</td>
                    <td style="padding:6px 0;color:#4b5563;font-size:15px;">
                      Submit a new application with updated information
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Support Information -->
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
                <h3 style="margin:0 0 12px;font-size:16px;color:#1e40af;">Need Assistance?</h3>
                <p style="margin:0 0 15px;font-size:14px;color:#1e3a8a;">
                  Our support team is here to help you understand the requirements and assist with your application.
                </p>
                <div style="margin-top:15px;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL}/contact"
                     style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:600;">
                    Contact Support Team
                  </a>
                </div>
              </div>

              <p style="margin:20px 0 0;font-size:15px;color:#4b5563;">
                We appreciate your interest in Alexander's Cuisine and hope to serve you soon.
              </p>

              <p style="margin:25px 0 0;font-size:15px;color:#374151;">
                Best regards,<br>
                <strong>The Alexander's Cuisine Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:13px;color:#6b7280;">
                <strong>Alexander's Handcrafted Cuisine</strong>
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#9ca3af;">
                📧 ${process.env.SMTP_USER || 'sales@avasiaonline.com'} | 🌐 ${process.env.NEXT_PUBLIC_BASE_URL}
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#9ca3af;">
                Application ID: ${data.applicationId}
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

    const textContent = `
Application Status Update - Regarding Your Discount Request

Dear ${data.userName},

Thank you for your interest in our ${discountTypeDisplay} discount program.

After careful review, we regret to inform you that we are unable to approve your discount application at this time.

${data.rejectionReason ? `Reason: ${data.rejectionReason}` : ''}

💡 What You Can Do Next:
- Review and update your application information
- Contact our support team for clarification
- Submit a new application with updated information

Contact us: ${process.env.NEXT_PUBLIC_BASE_URL}/contact

We appreciate your interest in Alexander's Cuisine and hope to serve you soon.

Best regards,
The Alexander's Cuisine Team

---
Application ID: ${data.applicationId}
    `;

    const info = await transporter.sendMail({
      from: `"Alexander's Cuisine - Discounts" <${process.env.SMTP_USER}>`,
      to: data.to,
      subject: `Update on Your Discount Application - Alexander's Cuisine`,
      html: htmlContent,
      text: textContent,
    });

    console.log('✅ Discount rejection email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send discount rejection email:', error);
    return false;
  }
}

/**
 * Optional: Send email notification to admin about pending GCash verification
 */
export async function sendAdminVerificationNotification({
  orderNumber,
  customerName,
  customerEmail,
  total,
  gcashReference,
  createdAt,
}: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  gcashReference?: string;
  createdAt: Date;
}): Promise<boolean> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (!adminEmail) {
      console.warn('⚠️ No admin email configured for notifications');
      return false;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GCash Payment Needs Verification</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:30px 0;">
        <table width="600" style="max-width:100%;background:#ffffff;border-radius:10px;box-shadow:0 4px 10px rgba(0,0,0,0.05);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:25px 30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;">GCash Payment Needs Verification</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:25px;">
              <p style="margin:0 0 15px;font-size:16px;color:#374151;">
                A new GCash payment requires verification:
              </p>
              <div style="background:#fef3c7;padding:18px;border-radius:6px;border:1px solid #fbbf24;">
                <p style="margin:8px 0;font-size:14px;color:#92400e;">
                  <strong>Order #:</strong> ${orderNumber}
                </p>
                <p style="margin:8px 0;font-size:14px;color:#92400e;">
                  <strong>Customer:</strong> ${customerName} (${customerEmail})
                </p>
                <p style="margin:8px 0;font-size:14px;color:#92400e;">
                  <strong>Amount:</strong> ₱${total.toFixed(2)}
                </p>
                ${gcashReference ? 
                  `<p style="margin:8px 0;font-size:14px;color:#92400e;">
                    <strong>GCash Ref:</strong> ${gcashReference}
                  </p>` : ''
                }
                <p style="margin:8px 0;font-size:14px;color:#92400e;">
                  <strong>Submitted:</strong> ${new Date(createdAt).toLocaleString()}
                </p>
              </div>
              <p style="margin:15px 0 0;font-size:14px;color:#6b7280;">
                Please verify this payment in your GCash app and update the order status in the admin panel.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 25px 25px;text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/gcash-orders"
                 style="display:inline-block;background:#d97706;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
                Go to GCash Verification →
              </a>
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
      from: `"Alexander's Cuisine - System" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `[Action Required] GCash Payment Verification - Order #${orderNumber}`,
      html: htmlContent,
    });

    console.log('✅ Admin notification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send admin notification email:', error);
    return false;
  }
}