import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from "@/lib/prisma";
import nodemailer from 'nodemailer';


export const dynamic = 'force-dynamic';

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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, to, subject, body } = await request.json();

    if (!messageId || !to || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reply from Alexander's Cuisine</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Alexander's Handcrafted Cuisine</h1>
              <p style="margin: 10px 0 0; color: #fef3c7; font-size: 16px;">Thank you for reaching out!</p>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <div style="color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${body.replace(/\n/g, '<br>')}</div>
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
    await transporter.sendMail({
      from: `"Alexander's Cuisine" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      text: body, // Plain text version
    });

    // Update message status to 'replied'
    await prisma.contactSubmission.update({
      where: { id: messageId },
      data: { status: 'replied' },
    });

    console.log(`✅ Reply sent to ${to}`);

    return NextResponse.json({ success: true, message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Error sending reply:', error);
    return NextResponse.json(
      { error: 'Failed to send reply' },
      { status: 500 }
    );
  }
}
