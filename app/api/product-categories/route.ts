import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const categories = await prisma.product.findMany({
            where: { available: true },
            select: { category: true },
            distinct: ['category'],
        });

        const categoryList = categories
           .map((c) => c.category)
           .filter((cat): cat is string => Boolean(cat));
        
        return NextResponse.json(categoryList);
      
    }catch (error) {
        console.error("Error fetching product categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch product categories" },
            { status: 500 }
        );
    }
}