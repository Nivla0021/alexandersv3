import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, token, newPassword } = await request.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Validate newPassword
    const passwordErrors: string[] = [];
    if (newPassword.length < 8) {
      passwordErrors.push('Password must be at least 8 characters.');
    }
    if (!/[A-Z]/.test(newPassword)) {
      passwordErrors.push('Password must contain at least one uppercase letter.');
    }
    if (!/[a-z]/.test(newPassword)) {
      passwordErrors.push('Password must contain at least one lowercase letter.');
    }
    if (!/[0-9]/.test(newPassword)) {
      passwordErrors.push('Password must contain at least one number.');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      passwordErrors.push('Password must contain at least one special character.');
    }
    if (passwordErrors.length > 0) {
      return NextResponse.json({ error: passwordErrors.join(' ') }, { status: 400 });
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

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { email: email.trim().toLowerCase() },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        modifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'An error occurred while resetting password' },
      { status: 500 }
    );
  }
}
