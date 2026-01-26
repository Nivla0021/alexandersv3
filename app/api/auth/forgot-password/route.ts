import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { checkSignupRateLimit } from '@/lib/rate-limit';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function generateSixDigitToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // -----------------------------
    // RATE LIMITING (FORGOT PASSWORD)
    // -----------------------------
    const rateLimitKey = `forgot-password:${normalizedEmail}`;
    const { success, remaining, reset } =
      await checkSignupRateLimit(rateLimitKey);

    console.log('FORGOT PASSWORD RATE LIMIT', {
      email: normalizedEmail,
      success,
      remaining,
      reset,
    });

    if (!success) {
      return NextResponse.json(
        {
          error:
            'Too many password reset requests. Please wait a few minutes before trying again.',
        },
        { status: 429 }
      );
    }

    // -----------------------------
    // USER LOOKUP
    // -----------------------------
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // ❗ Important security choice:
    // You can either:
    // A) return 404 (what you currently do)
    // B) return generic success to avoid email enumeration
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 404 }
      );
    }

    // -----------------------------
    // TOKEN GENERATION
    // -----------------------------
    const token = generateSixDigitToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expiresAt,
      },
    });

    // Send email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(to right, #d97706, #ea580c);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .token-box {
              background: white;
              border: 2px solid #d97706;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .token {
              font-size: 36px;
              font-weight: bold;
              color: #d97706;
              letter-spacing: 8px;
            }
            .warning {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${user.name || 'Customer'},</p>
              <p>You requested to reset your password for your Alexander's Handcrafted Cuisine account.</p>
              <p>Use the following verification code to reset your password:</p>
              
              <div class="token-box">
                <div class="token">${token}</div>
                <p style="color: #6b7280; margin-top: 10px;">Enter this code on the password reset page</p>
              </div>

              <div class="warning">
                <p style="margin: 0;"><strong>Important:</strong> This code will expire in 15 minutes.</p>
              </div>

              <p>If you didn't request this password reset, please ignore this email or contact us if you have concerns.</p>
              
              <div class="footer">
                <p>
                  <strong>Alexander's Handcrafted Cuisine</strong><br>
                  Authentic Filipino Food<br>
                  Metro Manila, Philippines
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // -----------------------------
    // SEND EMAIL
    // -----------------------------
    await transporter.sendMail({
      from: `"Alexander's Handcrafted Cuisine" <${process.env.SMTP_USER}>`,
      to: normalizedEmail,
      subject: 'Password Reset Verification Code',
      html:emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}