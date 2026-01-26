// app/admin/kiosk/page.tsx

import KioskClient from './KioskClient';

export const dynamic = 'force-dynamic';

// ---------- TYPES ----------
type Variant = {
  id: string;
  label: string;
  price: number;
  productId: string;
};

type Product = {
  id: string;
  name: string;
  image: string;
  available: boolean;
  category?: string | null;
  variants: Variant[];
};

// ---------- DATA ----------
async function getProducts(): Promise<Product[]> {
  try {
    const host =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const res = await fetch(
      `${host}/api/products`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status}`);
    }

    const products: Product[] = await res.json();
    console.log('Fetched products:', products);
    
    // Filter out products that have no variants
    return products.filter(product => 
      product.available && 
      product.variants && 
      product.variants.length > 0
    );
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