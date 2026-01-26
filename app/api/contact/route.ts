import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

const PH_MOBILE_REGEX = /^(09|\+639|639)\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    const errors: string[] = [];

    // Name validation
    if (!name || !name.trim()) {
      errors.push('Name is required.');
    } else if (name.trim().length < 2) {
      errors.push('Name must be at least 2 characters.');
    }

    // Email validation
    if (!email || !email.trim()) {
      errors.push('Email is required.');
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.push('Invalid email format.');
    }

    // Phone validation (optional)
    if (phone && !PH_MOBILE_REGEX.test(phone.trim())) {
      errors.push('Enter a valid PH mobile number (09XXXXXXXXX).');
    }

    // Message validation
    if (!message || !message.trim()) {
      errors.push('Message is required.');
    } else if (message.trim().length < 10) {
      errors.push('Message must be at least 10 characters.');
    } else if (message.trim().length > 1000) {
      errors.push('Message cannot exceed 1000 characters.');
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
    }

    const submission = await prisma.contactSubmission.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        message: message.trim(),
        status: 'new',
      },
    });

    return NextResponse.json(
      { message: 'Contact form submitted successfully', submission },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}
