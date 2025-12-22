// /api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Constants (keep these consistent with frontend + schema)
const NAME_MIN = 2;
const NAME_MAX = 100;
const PHONE_MAX = 20;
const ADDRESS_MAX = 500;

const NAME_REGEX = /^[a-zA-Z\s.'-]+$/;
const PH_MOBILE_REGEX = /^(09|\+639|639)\d{9}$/;

// Helpers
const capitalizeFullName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const rawName = body.name;
    const rawPhone = body.phone;
    const rawAddress = body.address;

    // -----------------------------
    // Name validation
    // -----------------------------
    if (!rawName || typeof rawName !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const name = rawName.trim();

    if (name.length < NAME_MIN || name.length > NAME_MAX) {
      return NextResponse.json(
        { error: `Name must be between ${NAME_MIN} and ${NAME_MAX} characters` },
        { status: 400 }
      );
    }

    if (!NAME_REGEX.test(name)) {
      return NextResponse.json(
        { error: 'Name contains invalid characters' },
        { status: 400 }
      );
    }

    const formattedName = capitalizeFullName(name);

    // -----------------------------
    // Phone validation (optional)
    // -----------------------------
    let phone: string | null = null;
    if (rawPhone) {
      if (typeof rawPhone !== 'string') {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        );
      }

      const cleanedPhone = rawPhone.replace(/\s+/g, '');

      if (cleanedPhone.length > PHONE_MAX) {
        return NextResponse.json(
          { error: 'Phone number is too long' },
          { status: 400 }
        );
      }

      if (!PH_MOBILE_REGEX.test(cleanedPhone)) {
        return NextResponse.json(
          { error: 'Enter a valid PH mobile number (09XXXXXXXXX)' },
          { status: 400 }
        );
      }

      phone = cleanedPhone;
    }

    // -----------------------------
    // Address validation (optional)
    // -----------------------------
    let address: string | null = null;
    if (rawAddress) {
      if (typeof rawAddress !== 'string') {
        return NextResponse.json(
          { error: 'Invalid address format' },
          { status: 400 }
        );
      }

      const trimmedAddress = rawAddress.trim();

      if (trimmedAddress.length > ADDRESS_MAX) {
        return NextResponse.json(
          { error: `Address must not exceed ${ADDRESS_MAX} characters` },
          { status: 400 }
        );
      }

      address = trimmedAddress;
    }

    // -----------------------------
    // Update user
    // -----------------------------
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: formattedName,
        phone,
        address,
        modifiedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating profile' },
      { status: 500 }
    );
  }
}
