import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import bcrypt from 'bcryptjs';
import { checkSignupRateLimit, resetRateLimit } from '@/lib/rate-limit';

import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { oldPassword, newPassword } = await request.json();

    // -----------------------------
    // RATE LIMITING (CHANGE PASSWORD)
    // -----------------------------
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1';

    const rateLimitKey = `change-password:${session.user.id}:${ip}`;
    const { success } = await checkSignupRateLimit(rateLimitKey);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // -----------------------------
    // BASIC VALIDATION
    // -----------------------------
    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // -----------------------------
    // NEW PASSWORD VALIDATION
    // -----------------------------
    const passwordErrors: string[] = [];
    if (newPassword.length < 8) passwordErrors.push('Password must be at least 8 characters.');
    if (!/[A-Z]/.test(newPassword)) passwordErrors.push('Must contain an uppercase letter.');
    if (!/[a-z]/.test(newPassword)) passwordErrors.push('Must contain a lowercase letter.');
    if (!/[0-9]/.test(newPassword)) passwordErrors.push('Must contain a number.');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword))
      passwordErrors.push('Must contain a special character.');

    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { error: passwordErrors.join(' ') },
        { status: 400 }
      );
    }

    // -----------------------------
    // USER LOOKUP
    // -----------------------------
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // -----------------------------
    // VERIFY OLD PASSWORD
    // -----------------------------
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);

    if (!isValidPassword) {
      // ❌ WRONG PASSWORD → COUNTS AGAINST LIMIT
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // -----------------------------
    // SUCCESS → RESET LIMITER
    // -----------------------------
    await resetRateLimit(rateLimitKey);

    if (oldPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        password: hashedPassword,
        modifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'An error occurred while changing password' },
      { status: 500 }
    );
  }
}
