// api/auth/customer-signup/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { checkSignupRateLimit } from '@/lib/rate-limit';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// -------------------- HELPERS --------------------
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters long' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain at least one lowercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain at least one number' };
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { valid: false, message: 'Password must contain at least one special character' };
  return { valid: true };
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function capitalizeFullName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}


const LIMITS = {
  name: { min: 2, max: 100 },
  email: { min: 5, max: 254 },
  password: { min: 8, max: 72 },
  phone: { min: 7, max: 20 },
};

function validateLength(value: string, field: string, min: number, max: number) {
  if (value.length < min || value.length > max) return `${field} must be between ${min} and ${max} characters`;
  return null;
}

// -------------------- API HANDLER --------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { name, email, password, phone, role } = body;

    name = name?.trim();
    email = email?.trim().toLowerCase();
    phone = phone?.trim();
    role = role?.trim().toLowerCase();

    if (!name || !email || !password) return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    if (!validateEmail(email)) return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) return NextResponse.json({ error: passwordValidation.message }, { status: 400 });

    if (!/^[a-zA-Z\s.'-]+$/.test(name)) return NextResponse.json({ error: 'Name contains invalid characters' }, { status: 400 });

    let error =
      validateLength(name, 'Name', LIMITS.name.min, LIMITS.name.max) ||
      validateLength(email, 'Email', LIMITS.email.min, LIMITS.email.max) ||
      validateLength(password, 'Password', LIMITS.password.min, LIMITS.password.max);

    if (error) return NextResponse.json({ error }, { status: 400 });
    if (phone) {
      error = validateLength(phone, 'Phone number', LIMITS.phone.min, LIMITS.phone.max);
      if (error) return NextResponse.json({ error }, { status: 400 });
    }

    // -------------------- USER CHECK --------------------
    const existingUser = await prisma.user.findUnique({ where: { email } });

    // -----------------------------
    // RATE LIMITING (ANTI-SPAM)
    // -----------------------------
    // Key: limit by unverified email only
    const rateLimitKey = `signup:${email}`;
    if (!existingUser || !existingUser.emailVerified) {
      const { success, remaining, reset } = await checkSignupRateLimit(rateLimitKey);

      console.log('RATE LIMIT DEBUG', { email, success, remaining, reset });

      if (!success) {
        return NextResponse.json(
          { error: 'Too many signup attempts for this email. Please try again after 5 minutes.' },
          { status: 429 }
        );
      }
    } else {
      // Verified email → block immediately
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }


    // -------------------- CREATE NEW USER --------------------
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: capitalizeFullName(name),
        email,
        password: hashedPassword,
        phone: phone || null,
        role: role,
      },
    });


    console.log(`✅ New admin registered: ${email}`);

    return NextResponse.json(
      {
        message: 'Creation successful! ',
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in customer signup:', error);
    return NextResponse.json({ error: 'An error occurred during registration. Please try again.' }, { status: 500 });
  }
}


