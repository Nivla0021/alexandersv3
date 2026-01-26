import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export async function GET() {
  try {

      const products = await prisma.product.findMany({
        where: { featured: true },
        orderBy: { createdAt: 'desc' },
      });
  
      return NextResponse.json(products, { status: 200 });
    } catch (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }
}
