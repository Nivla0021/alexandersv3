//api/auth/customer-signup/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { signupRateLimit } from '@/lib/rate-limit';


const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// -------------------- HELPERS --------------------

// Password validation helper
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  return { valid: true };
}

// Email validation helper
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Name normalization helper
function capitalizeFullName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// -------------------- EMAIL SETUP --------------------

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const LIMITS = {
  name: { min: 2, max: 100 },
  email: { min: 5, max: 254 },
  password: { min: 8, max: 72 },
  phone: { min: 7, max: 20 },
  address: { min: 5, max: 500 },
};

function validateLength(
  value: string,
  field: string,
  min: number,
  max: number
) {
  if (value.length < min || value.length > max) {
    return `${field} must be between ${min} and ${max} characters`;
  }
  return null;
}

// -------------------- API HANDLER --------------------

export async function POST(request: Request) {
  try {
    // -----------------------------
    // RATE LIMITING (ANTI-SPAM)
    // -----------------------------
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1';

    const { success } = await signupRateLimit.limit(`signup:${ip}`);

    console.log('RATE LIMIT DEBUG', {
      ip,
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      );
    }
    let { name, email, password, phone, address } = await request.json();

    // -----------------------------
    // Normalize input
    // -----------------------------
    name = name?.trim();
    email = email?.trim().toLowerCase();
    phone = phone?.trim();
    address = address?.trim();

    // -----------------------------
    // Required fields
    // -----------------------------
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // -----------------------------
    // Name character validation
    // -----------------------------
    if (!/^[a-zA-Z\s.'-]+$/.test(name)) {
      return NextResponse.json(
        { error: 'Name contains invalid characters' },
        { status: 400 }
      );
    }

    // -----------------------------
    // Length validations
    // -----------------------------
    let error =
      validateLength(name, 'Name', LIMITS.name.min, LIMITS.name.max) ||
      validateLength(email, 'Email', LIMITS.email.min, LIMITS.email.max) ||
      validateLength(password, 'Password', LIMITS.password.min, LIMITS.password.max);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    if (phone) {
      error = validateLength(phone, 'Phone number', LIMITS.phone.min, LIMITS.phone.max);
      if (error) {
        return NextResponse.json({ error }, { status: 400 });
      }
    }

    if (address) {
      error = validateLength(address, 'Address', LIMITS.address.min, LIMITS.address.max);
      if (error) {
        return NextResponse.json({ error }, { status: 400 });
      }
    }

    // -----------------------------
    // Email format
    // -----------------------------
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // -----------------------------
    // Password strength
    // -----------------------------
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // -------------------- USER CHECK --------------------

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        );
      } else {
        // Resend verification
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires,
          },
        });

        await sendVerificationEmail(email, name, verificationToken);

        return NextResponse.json({
          message: 'Verification email resent. Please check your inbox.',
          requiresVerification: true,
        });
      }
    }

    // -------------------- CREATE USER --------------------

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        address: address || null,
        role: 'customer',
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    await sendVerificationEmail(email, name, verificationToken);

    console.log(`✅ New customer registered: ${email}`);

    return NextResponse.json(
      {
        message: 'Registration successful! Please check your email to verify your account.',
        requiresVerification: true,
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in customer signup:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}

// -------------------- EMAIL FUNCTION --------------------

async function sendVerificationEmail(email: string, name: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"Alexander's Cuisine" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Email - Alexander\'s Cuisine',
    html: `
      <h2>Hi ${name},</h2>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `,
    text: `Hi ${name},\n\nPlease verify your email:\n${verificationUrl}`,
  });

  console.log(`📧 Verification email sent to ${email}`);
}
