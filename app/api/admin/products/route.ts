import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

// Helper function to map frontend product type to Prisma enum
function mapProductType(formType: string): 'in_store' | 'online' | 'both' {
  switch (formType) {
    case 'in-store':
      return 'in_store';
    case 'online':
      return 'online';
    case 'both':
      return 'both';
    default:
      throw new Error(`Invalid product type: ${formType}`);
  }
}

// Helper function to validate variants based on product type
function validateVariants(
  variants: { label: string; inStorePrice: string | null; onlinePrice: string | null }[],
  productType: 'in_store' | 'online' | 'both'
): { valid: boolean; error?: string } {
  if (!variants.length) {
    return { valid: false, error: 'At least one variant is required' };
  }

  for (const variant of variants) {
    if (!variant.label?.trim()) {
      return { valid: false, error: 'Variant label is required' };
    }

    if (productType === 'both') {
      if (!variant.inStorePrice || !variant.onlinePrice) {
        return { 
          valid: false, 
          error: 'For "both" product type, each variant must have both in-store and online prices' 
        };
      }
    } else if (productType === 'in_store') {
      if (!variant.inStorePrice) {
        return { 
          valid: false, 
          error: 'For in-store products, each variant must have an in-store price' 
        };
      }
    } else if (productType === 'online') {
      if (!variant.onlinePrice) {
        return { 
          valid: false, 
          error: 'For online products, each variant must have an online price' 
        };
      }
    }
  }

  return { valid: true };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { variants: true },
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
    const productType = formData.get('productType') as string;
    const imageFile = formData.get('image') as File | null;
    const variantsStr = formData.get('variants') as string;

    // Validate required fields
    if (!name || !description || !recipe || !productType || !variantsStr) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Parse variants
    let variants;
    try {
      variants = JSON.parse(variantsStr) as { 
        label: string; 
        inStorePrice: string | null; 
        onlinePrice: string | null;
      }[];
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid variants format' 
      }, { status: 400 });
    }

    // Map product type to enum value
    let dbProductType: 'in_store' | 'online' | 'both';
    try {
      dbProductType = mapProductType(productType);
    } catch (error: any) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 400 });
    }

    // Validate variants
    const validation = validateVariants(variants, dbProductType);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // --- Handle image file ---
    let imageUrl = '';
    if (imageFile && imageFile.size > 0) {
      try {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadDir = path.join(process.cwd(), 'public', 'product_images');
        
        // Create directory if it doesn't exist
        try { 
          await fs.access(uploadDir); 
        } catch { 
          await fs.mkdir(uploadDir, { recursive: true }); 
        }
        
        const timestamp = Date.now();
        const fileName = `${timestamp}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadPath = path.join(uploadDir, fileName);
        await writeFile(uploadPath, new Uint8Array(buffer));
        imageUrl = `/product_images/${fileName}`;
      } catch (error) {
        console.error('Error saving image:', error);
        return NextResponse.json({ 
          error: 'Failed to save product image' 
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({ 
        error: 'Product image is required' 
      }, { status: 400 });
    }

    // Create product with variants
    try {
      const product = await prisma.product.create({
        data: {
          name,
          description,
          recipe,
          image: imageUrl,
          category: category || null,
          available: available !== 'false',
          featured: featured === 'true',
          productType: dbProductType,
          variants: {
            create: variants.map((v) => ({
              label: v.label,
              inStorePrice: v.inStorePrice ? parseFloat(v.inStorePrice) : null,
              onlinePrice: v.onlinePrice ? parseFloat(v.onlinePrice) : null,
            })),
          },
        },
        include: { variants: true },
      });

      return NextResponse.json(product, { status: 201 });
    } catch (error: any) {
      console.error('Error creating product in database:', error);
      
      // Handle unique constraint violation
      if (error.code === 'P2002') {
        return NextResponse.json({ 
          error: 'A product with this name already exists' 
        }, { status: 400 });
      }
      
      throw error;
    }
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
    const productType = formData.get('productType') as string;
    const imageFile = formData.get('image') as File | null;
    const variantsStr = formData.get('variants') as string;

    // Validate required fields
    if (!id || !name || !description || !recipe || !productType || !variantsStr) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Parse variants
    let variants;
    try {
      variants = JSON.parse(variantsStr) as { 
        label: string; 
        inStorePrice: string | null; 
        onlinePrice: string | null;
      }[];
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid variants format' 
      }, { status: 400 });
    }

    // Map product type to enum value
    let dbProductType: 'in_store' | 'online' | 'both';
    try {
      dbProductType = mapProductType(productType);
    } catch (error: any) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 400 });
    }

    // Validate variants
    const validation = validateVariants(variants, dbProductType);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });
    
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Handle image upload if new image provided
    let imageUrl = existingProduct.image;
    if (imageFile && imageFile.size > 0) {
      try {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadDir = path.join(process.cwd(), 'public', 'product_images');
        
        // Create directory if it doesn't exist
        try { 
          await fs.access(uploadDir); 
        } catch { 
          await fs.mkdir(uploadDir, { recursive: true }); 
        }
        
        const timestamp = Date.now();
        const fileName = `${timestamp}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadPath = path.join(uploadDir, fileName);
        await writeFile(uploadPath, new Uint8Array(buffer));
        imageUrl = `/product_images/${fileName}`;

        // Delete old image
        if (existingProduct.image) {
          const oldImagePath = path.join(process.cwd(), 'public', existingProduct.image.replace(/^\//, ''));
          try { 
            await fs.unlink(oldImagePath); 
          } catch (err) {
            console.error('Error deleting old image:', err);
            // Continue even if old image deletion fails
          }
        }
      } catch (error) {
        console.error('Error saving new image:', error);
        return NextResponse.json({ 
          error: 'Failed to save product image' 
        }, { status: 500 });
      }
    }

    // Update product with variants using a transaction
    try {
      const updatedProduct = await prisma.$transaction(async (tx) => {
        // Delete old variants
        await tx.productVariant.deleteMany({ 
          where: { productId: id } 
        });

        // Update product and create new variants
        return tx.product.update({
          where: { id },
          data: {
            name,
            description,
            recipe,
            category: category || null,
            available: available !== 'false',
            featured: featured === 'true',
            productType: dbProductType,
            image: imageUrl,
            variants: {
              create: variants.map((v) => ({
                label: v.label,
                inStorePrice: v.inStorePrice ? parseFloat(v.inStorePrice) : null,
                onlinePrice: v.onlinePrice ? parseFloat(v.onlinePrice) : null,
              })),
            },
          },
          include: { variants: true },
        });
      });

      return NextResponse.json(updatedProduct);
    } catch (error: any) {
      console.error('Error updating product in database:', error);
      
      // Handle unique constraint violation
      if (error.code === 'P2002') {
        return NextResponse.json({ 
          error: 'A product with this name already exists' 
        }, { status: 400 });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product' },
      { status: 500 }
    );
  }
}

// Endpoint for toggling fields (available/featured)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, available, featured } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (available !== undefined) updateData.available = available;
    if (featured !== undefined) updateData.featured = featured;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
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
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({ 
      where: { id },
      include: { 
        orderItems: true,
        sales: true 
      }
    });
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if product has any orders or sales
    if (product.orderItems.length > 0 || product.sales.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete product with existing orders or sales' 
      }, { status: 400 });
    }

    // Delete product image if it exists
    if (product.image) {
      const fullPath = path.join(process.cwd(), 'public', product.image.replace(/^\//, ''));
      try { 
        await fs.unlink(fullPath); 
      } catch (err) {
        console.error('Error deleting product image:', err);
        // Continue even if image deletion fails
      }
    }

    // Delete the product (variants will be deleted automatically due to cascade)
    await prisma.product.delete({ 
      where: { id } 
    });

    return NextResponse.json({ 
      message: 'Product deleted successfully', 
      deletedProduct: product.name 
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    
    // Handle foreign key constraint failures
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Cannot delete product because it is referenced in orders or sales' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Failed to delete product' 
    }, { status: 500 });
  }
}