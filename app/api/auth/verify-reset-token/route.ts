import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json({ error: 'Email and token are required' }, { status: 400 });
    }

    // Check if token is 6 digits
    if (!/^\d{6}$/.test(token)) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }

    // Find user with matching token
    const user = await prisma.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        passwordResetToken: token,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Check if token is expired
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Token verified successfully',
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred while verifying token' },
      { status: 500 }
    );
  }
}
