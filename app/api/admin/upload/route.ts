// app/api/admin/upload/route.ts
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

// Function to generate a random 5-character alphanumeric string
function generateShortId(length: number = 5): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Function to ensure uniqueness by checking if file exists (optional, can be enhanced)
function generateUniqueId(existingFiles: Set<string> = new Set()): string {
  let id = generateShortId(5);
  // Simple collision check - in practice, timestamp + random makes collisions extremely unlikely
  while (existingFiles.has(id)) {
    id = generateShortId(5);
  }
  return id;
}

export async function POST(request: Request) {
  try {
    // Check content type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content type must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string || 'general';

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Please upload JPEG, PNG, GIF, or WEBP images only.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const originalName = file.name;
    const fileExtension = path.extname(originalName) || '.jpg';
    const fileNameWithoutExt = path.basename(originalName, fileExtension);
    
    // Sanitize filename (remove special characters, spaces)
    const sanitizedName = fileNameWithoutExt
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .substring(0, 30); // Limit length to avoid too long filenames
    
    // Generate 5-character unique ID
    const uniqueId = generateShortId(5);
    const timestamp = Date.now();
    const filename = `${sanitizedName}-${timestamp}-${uniqueId}${fileExtension}`;

    // Determine upload directory based on type
    let uploadSubDir = 'general';
    switch (type) {
      case 'qr-code':
        uploadSubDir = 'qr-codes';
        break;
      case 'slider':
        uploadSubDir = 'slider';
        break;
      case 'product':
        uploadSubDir = 'products';
        break;
      case 'testimonial':
        uploadSubDir = 'testimonials';
        break;
      case 'receipt':
        uploadSubDir = 'receipts';
        break;
      case 'profile':
        uploadSubDir = 'profiles';
        break;
      default:
        uploadSubDir = 'general';
    }

    // Define upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', uploadSubDir);
    
    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Create public URL
    const publicUrl = `/uploads/${uploadSubDir}/${filename}`;

    // Log upload
    console.log(`File uploaded: ${publicUrl} (${file.type}, ${(file.size / 1024).toFixed(2)}KB)`);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename,
      originalName: originalName,
      size: file.size,
      type: file.type,
      uploadType: type,
      uniqueId: uniqueId // Return the generated ID if needed
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error uploading file:', error);
    
    // Handle specific errors
    if (error.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Failed to create upload directory' },
        { status: 500 }
      );
    }

    if (error.code === 'ENOSPC') {
      return NextResponse.json(
        { error: 'No space left on server' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Optional: Handle file deletion
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'File URL is required' },
        { status: 400 }
      );
    }

    // Security: Only allow deletion from uploads directory
    if (!fileUrl.startsWith('/uploads/')) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }

    // Convert URL to file path
    const filePath = path.join(process.cwd(), 'public', fileUrl);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete file
    const { unlink } = await import('fs/promises');
    await unlink(filePath);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete file' },
      { status: 500 }
    );
  }
}

// Optional: Get file information
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'File URL is required' },
        { status: 400 }
      );
    }

    // Security: Only allow access from uploads directory
    if (!fileUrl.startsWith('/uploads/')) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }

    // Convert URL to file path
    const filePath = path.join(process.cwd(), 'public', fileUrl);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Get file stats
    const { stat } = await import('fs/promises');
    const stats = await stat(filePath);

    return NextResponse.json({
      success: true,
      url: fileUrl,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      filename: path.basename(filePath)
    });

  } catch (error: any) {
    console.error('Error getting file info:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get file info' },
      { status: 500 }
    );
  }
}

// Configuration for the route
export const config = {
  api: {
    bodyParser: false, // Disable body parsing for file uploads
  },
};