import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const MIN_LENGTH = 10;
const MAX_LENGTH = 300;
export async function GET(req: NextRequest) {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(testimonials);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { customerName, message } = await req.json();

    if (!customerName || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Validate message length
    if (message.length < MIN_LENGTH || message.length > MAX_LENGTH) {
      return NextResponse.json({
        error: `Message must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`,
      }, { status: 400 });
    }

    const newTestimonial = await prisma.testimonial.create({
      data: { customerName, message },
    });

    return NextResponse.json(newTestimonial);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, customerName, message } = await req.json();

    if (!id || !customerName || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Validate message length
    if (message.length < MIN_LENGTH || message.length > MAX_LENGTH) {
      return NextResponse.json({
        error: `Message must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`,
      }, { status: 400 });
    }

    const updatedTestimonial = await prisma.testimonial.update({
      where: { id },
      data: { customerName, message },
    });

    return NextResponse.json(updatedTestimonial);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing testimonial ID' }, { status: 400 });
    }

    await prisma.testimonial.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 });
  }
}
