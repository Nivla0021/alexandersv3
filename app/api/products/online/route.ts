// app/api/products/online/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET endpoint for fetching online products with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    const featured = searchParams.get('featured');

    // Build where clause for online products
    const where: any = {
      available: true,
      productType: { in: ['online', 'both'] },
    };

    // Filter by category if provided and not 'all'
    if (category && category !== 'all' && category !== 'undefined' && category !== 'null') {
      where.category = category;
    }

    // Filter by featured if requested
    if (featured === 'true') {
      where.featured = true;
    }

    // Search by name if search term provided
    if (search && search.trim() !== '') {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    // Build query options
    const queryOptions: any = {
      where,
      include: {
        variants: {
          where: {
            onlinePrice: { not: null },
          },
          orderBy: {
            onlinePrice: 'asc',
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { name: 'asc' },
      ],
    };

    // Apply limit if provided
    if (limit && !isNaN(parseInt(limit))) {
      queryOptions.take = parseInt(limit);
    }

    // Fetch products
    const products = await prisma.product.findMany(queryOptions);

    // Filter out products that have no online variants
    const onlineProducts = products.filter(product => product.variants.length > 0);

    // Transform the data for the frontend
    const transformedProducts = onlineProducts.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      recipe: product.recipe,
      image: product.image,
      category: product.category,
      available: product.available,
      featured: product.featured,
      productType: product.productType,
      variants: product.variants.map(variant => ({
        id: variant.id,
        label: variant.label,
        price: Number(variant.onlinePrice),
        inStorePrice: variant.inStorePrice ? Number(variant.inStorePrice) : null,
        onlinePrice: Number(variant.onlinePrice),
      })),
      minPrice: Math.min(...product.variants.map(v => Number(v.onlinePrice))),
      maxPrice: Math.max(...product.variants.map(v => Number(v.onlinePrice))),
      variantCount: product.variants.length,
    }));

    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error('Error fetching online products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch online products' },
      { status: 500 }
    );
  }
}

// POST endpoint for fetching specific products by IDs (for cart)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds } = body;

    // Validate input
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs are required and must be an array' },
        { status: 400 }
      );
    }

    console.log('Fetching products for cart:', productIds);

    // Fetch products by IDs
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        available: true,
        productType: { in: ['online', 'both'] },
      },
      include: {
        variants: {
          where: {
            onlinePrice: { not: null },
          },
        },
      },
    });

    console.log('Found products:', products.length);

    // Transform the data
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      recipe: product.recipe,
      image: product.image,
      category: product.category,
      available: product.available,
      featured: product.featured,
      productType: product.productType,
      variants: product.variants.map(variant => ({
        id: variant.id,
        label: variant.label,
        price: Number(variant.onlinePrice),
        inStorePrice: variant.inStorePrice ? Number(variant.inStorePrice) : null,
        onlinePrice: Number(variant.onlinePrice),
      })),
    }));

    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error('Error fetching products by IDs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}