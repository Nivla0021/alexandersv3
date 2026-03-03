import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'You must be logged in' }, { status: 401 });
    }

    // Check if user already has an approved discount
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { discountApproved: true, discountType: true }
    });

    if (user?.discountApproved) {
      return NextResponse.json({ 
        error: 'You already have an approved discount',
        discountType: user.discountType
      }, { status: 400 });
    }

    const formData = await req.formData();
    
    const discountType = formData.get('discountType') as string;
    const birthday = formData.get('birthday') as string;
    const idNumber = formData.get('idNumber') as string;
    const idImage = formData.get('idImage') as File | null;

    // Validate required fields
    if (!discountType || !birthday || !idNumber || !idImage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['PWD', 'SENIOR'].includes(discountType)) {
      return NextResponse.json({ error: 'Invalid discount type' }, { status: 400 });
    }

    // Validate file type
    if (!idImage.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (idImage.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image size should be less than 5MB' }, { status: 400 });
    }

    // Validate age for senior citizens
    if (discountType === 'SENIOR') {
      const birthDate = new Date(birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 60) {
        return NextResponse.json({ error: 'Senior Citizen discount requires age 60 and above' }, { status: 400 });
      }
    }

    // Check if user already has a pending discount application
    const existingPending = await prisma.discountApproval.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      return NextResponse.json({ 
        error: 'You already have a pending discount application. Please wait for admin approval.' 
      }, { status: 400 });
    }

    // --- Handle image file upload to public folder ---
    const bytes = await idImage.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'discount-ids');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(idImage.name);
    const sanitizedName = idImage.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.[^/.]+$/, '');
    const fileName = `${timestamp}-${randomString}-${sanitizedName}${fileExtension}`;
    
    const uploadPath = path.join(uploadDir, fileName);
    
    // Write file to disk
    await writeFile(uploadPath, new Uint8Array(buffer));
    
    // Generate public URL for the image
    const imageUrl = `/uploads/discount-ids/${fileName}`;

    // Create discount approval record (for historical tracking)
    const discountApproval = await prisma.discountApproval.create({
      data: {
        userId: session.user.id,
        discountType,
        birthday: new Date(birthday),
        idNumber,
        idImageUrl: imageUrl,
        status: 'PENDING',
        isApproved: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Discount application submitted successfully. It will be reviewed by our team. Once approved, the discount will be automatically applied to all your future orders.',
      approvalId: discountApproval.id,
      status: 'PENDING',
      imageUrl: imageUrl,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Discount application error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit discount application' },
      { status: 500 }
    );
  }
}