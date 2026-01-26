// app/admin/kiosk/page.tsx

import KioskClient from './KioskClient';

export const dynamic = 'force-dynamic';



// ---------- TYPES ----------
type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  available: boolean;
  category?: string | null;
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

    const products: Product[] = await res.json();
    return products;
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
