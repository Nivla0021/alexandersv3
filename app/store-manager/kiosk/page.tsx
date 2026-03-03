// app/admin/kiosk/page.tsx

import KioskClient from './KioskClient';

export const dynamic = 'force-dynamic';

// ---------- TYPES ----------
type Variant = {
  id: string;
  label: string;
  price: number; // This will be the inStorePrice for kiosk
  inStorePrice: number | null;
  onlinePrice?: number | null; // Optional for kiosk
  productId: string;
};

type Product = {
  id: string;
  name: string;
  description?: string;
  image: string;
  available: boolean;
  category?: string | null;
  productType: 'in_store' | 'online' | 'both';
  variants: Variant[];
};

// ---------- DATA ----------
async function getProducts(): Promise<Product[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/products`, { 
      cache: 'no-store' 
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status}`);
    }

    const products: Product[] = await res.json();

    // Filter products that are available in-store
    const inStoreProducts = (products ?? [])
      .filter((p: any) => {
        // Check if product is available in store
        const isInStoreAvailable = 
          p.productType === 'in_store' || 
          p.productType === 'both';
        
        // Check if product has at least one variant with in-store price
        const hasInStoreVariant = p.variants?.some(
          (v: any) => v.inStorePrice && v.inStorePrice > 0
        );

        return isInStoreAvailable && hasInStoreVariant && p.available;
      })
      .map((p: any) => ({
        ...p,
        // Only include variants that have in-store prices
        variants: p.variants
          ?.filter((v: any) => v.inStorePrice && v.inStorePrice > 0)
          .map((v: any) => ({
            id: v.id,
            label: v.label,
            price: parseFloat(v.inStorePrice), // Use inStorePrice for kiosk display
            inStorePrice: parseFloat(v.inStorePrice),
            onlinePrice: v.onlinePrice ? parseFloat(v.onlinePrice) : null,
            productId: p.id,
          })) ?? [],
      }));

    // Return only products that have at least one variant after filtering
    return inStoreProducts.filter(product => product.variants.length > 0);
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// ---------- PAGE ----------
export default async function KioskPage() {
  const products = await getProducts();

  return <KioskClient products={products} />;
}