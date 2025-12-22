import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs/promises';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse FormData directly (don't use formidable for App Router)
    const formData = await req.formData();
    
    // Get form values
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const recipe = formData.get('recipe') as string;
    const priceStr = formData.get('price') as string;
    const category = formData.get('category') as string;
    const available = formData.get('available') as string;
    const imageFile = formData.get('image') as File | null;

    if (!name || !description || !priceStr || !recipe) {
      console.error('Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // --- Handle image file ---
    let imageUrl = '';
    if (imageFile && imageFile.size > 0) {
      try {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Create directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'product_images');
        const fs = await import('fs/promises');
        try {
          await fs.access(uploadDir);
        } catch {
          await fs.mkdir(uploadDir, { recursive: true });
        }
        
        // Create unique filename
        const timestamp = Date.now();
        const originalName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}-${originalName}`;
        const uploadPath = path.join(uploadDir, fileName);
        
        // Save file
        await writeFile(uploadPath, new Uint8Array(buffer));
        imageUrl = `/product_images/${fileName}`;
        console.log('File saved at:', uploadPath);
      } catch (error) {
        console.error('Error saving image:', error);
        return NextResponse.json({ error: 'Failed to save image' }, { status: 500 });
      }
    }

    // Create product in database
    const product = await prisma.product.create({
      data: {
        name,
        description,
        recipe,
        price: parseFloat(priceStr),
        image: imageUrl,
        category,
        available: available !== 'false',
      },
    });

    console.log('Product created successfully:', product);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
}

// PATCH is similar: parse form, update fields, upload new image if present
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const recipe = formData.get('recipe') as string;
    const priceStr = formData.get('price') as string;
    const category = formData.get('category') as string;
    const available = formData.get('available') as string;
    const imageFile = formData.get('image') as File | null;

    if (!id || !name || !description || !priceStr || !recipe) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let imageUrl = existingProduct.image;
    
    // Handle new image upload if provided
    if (imageFile && imageFile.size > 0) {
      try {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const uploadDir = path.join(process.cwd(), 'public', 'product_images');
        const fs = await import('fs/promises');
        
        try {
          await fs.access(uploadDir);
        } catch {
          await fs.mkdir(uploadDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const originalName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}-${originalName}`;
        const uploadPath = path.join(uploadDir, fileName);
        
        await writeFile(uploadPath, new Uint8Array(buffer));
        imageUrl = `/product_images/${fileName}`;
        
        // Optional: Delete old image file
        if (existingProduct.image) {
          const oldImagePath = path.join(process.cwd(), 'public', existingProduct.image);
          try {
            await fs.unlink(oldImagePath);
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }
      } catch (error) {
        console.error('Error saving image:', error);
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        recipe,
        price: parseFloat(priceStr),
        image: imageUrl,
        category,
        available: available !== 'false',
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // First, fetch the product to get the image path
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete the image file if it exists
    if (product.image && product.image.trim() !== '') {
      try {
        // Remove leading slash if present to create proper path
        const cleanImagePath = product.image.startsWith('/') 
          ? product.image.substring(1) 
          : product.image;
        
        const fullImagePath = path.join(process.cwd(), 'public', cleanImagePath);
        
        // Check if file exists before deleting
        try {
          await fs.access(fullImagePath);
          await fs.unlink(fullImagePath);
          console.log(`✅ Image deleted: ${fullImagePath}`);
        } catch (fsError: any) {
          if (fsError.code === 'ENOENT') {
            console.warn(`⚠️ Image file not found: ${fullImagePath}`);
          } else {
            console.warn(`⚠️ Could not delete image file: ${fullImagePath}`, fsError);
          }
        }
      } catch (error) {
        console.error('❌ Error during image deletion process:', error);
        // Don't throw - continue with product deletion
      }
    }

    // Delete the product from database
    await prisma.product.delete({
      where: { id },
    });

    console.log(`✅ Product deleted: ${product.name} (${id})`);
    return NextResponse.json({ 
      message: 'Product deleted successfully',
      deletedProduct: product.name 
    });
  } catch (error: any) {
    console.error('❌ Error deleting product:', error);
    
    // Handle Prisma specific errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Product not found or already deleted' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
