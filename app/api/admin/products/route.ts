import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { variants: true }, // <-- include variants
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
    const role = (session?.user as any)?.role;
    if (!session || !['admin', 'store-manager'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const recipe = formData.get('recipe') as string;
    const category = formData.get('category') as string;
    const available = formData.get('available') as string;
    const featured = formData.get('featured') as string;
    const imageFile = formData.get('image') as File | null;
    const variantsStr = formData.get('variants') as string; // <-- new

    if (!name || !description || !recipe || !variantsStr) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const variants = JSON.parse(variantsStr) as { label: string; price: string }[];
    if (!variants.length) {
      return NextResponse.json({ error: 'At least one variant is required' }, { status: 400 });
    }

    // --- Handle image file ---
    let imageUrl = '';
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = path.join(process.cwd(), 'public', 'product_images');
      try { await fs.access(uploadDir); } catch { await fs.mkdir(uploadDir, { recursive: true }); }
      const timestamp = Date.now();
      const fileName = `${timestamp}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const uploadPath = path.join(uploadDir, fileName);
      await writeFile(uploadPath, new Uint8Array(buffer));
      imageUrl = `/product_images/${fileName}`;
    }

    // Create product with variants
    const product = await prisma.product.create({
      data: {
        name,
        description,
        recipe,
        image: imageUrl,
        category,
        available: available !== 'false',
        featured: featured === 'true',
        variants: {
          create: variants.map((v) => ({
            label: v.label,
            price: parseFloat(v.price),
          })),
        },
      },
      include: { variants: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
}

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
    const category = formData.get('category') as string;
    const available = formData.get('available') as string;
    const featured = formData.get('featured') as string;
    const imageFile = formData.get('image') as File | null;
    const variantsStr = formData.get('variants') as string;

    if (!id || !name || !description || !recipe || !variantsStr) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const variants = JSON.parse(variantsStr) as { label: string; price: string }[];
    if (!variants.length) {
      return NextResponse.json({ error: 'At least one variant is required' }, { status: 400 });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });
    if (!existingProduct) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    let imageUrl = existingProduct.image;
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = path.join(process.cwd(), 'public', 'product_images');
      try { await fs.access(uploadDir); } catch { await fs.mkdir(uploadDir, { recursive: true }); }
      const timestamp = Date.now();
      const fileName = `${timestamp}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const uploadPath = path.join(uploadDir, fileName);
      await writeFile(uploadPath, new Uint8Array(buffer));
      imageUrl = `/product_images/${fileName}`;

      // Delete old image
      if (existingProduct.image) {
        const oldImagePath = path.join(process.cwd(), 'public', existingProduct.image.replace(/^\//, ''));
        try { await fs.unlink(oldImagePath); } catch {}
      }
    }

    // Delete old variants & recreate
    await prisma.productVariant.deleteMany({ where: { productId: id } });

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        recipe,
        category,
        available: available !== 'false',
        featured: featured === 'true',
        image: imageUrl,
        variants: {
          create: variants.map((v) => ({
            label: v.label,
            price: parseFloat(v.price),
          })),
        },
      },
      include: { variants: true },
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
    if (!id) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    if (product.image) {
      const fullPath = path.join(process.cwd(), 'public', product.image.replace(/^\//, ''));
      try { await fs.unlink(fullPath); } catch {}
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ message: 'Product deleted successfully', deletedProduct: product.name });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 });
  }
}
