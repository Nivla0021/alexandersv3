import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CategoryTabs } from '@/components/category-tabs';
import { MenuClient } from '@/components/menu-client';


export const dynamic = 'force-dynamic';

// ------- PRODUCT TYPE -------
type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  available: boolean;
  category?: string;
  variants: {
    id: string;
    label: string;
    price: number;
  }[];
};

// ------- FETCH PRODUCTS (CATEGORY ONLY) -------
async function getProducts(category?: string): Promise<Product[]> {
  try {
    const host =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const res = await fetch(
      `${host}/api/products?category=${category}`,
      { cache: 'no-store' }
    );

    const products = await res.json();
    console.log('Fetched products:', products);

    // Ensure variant prices are numbers
    return (products ?? []).map((p: any) => ({
      ...p,
      variants: p.variants?.map((v: any) => ({
        ...v,
        price: parseFloat(v.price),
      })) ?? [],
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// ------- FETCH CATEGORIES -------
async function getCategories() {
  try {
    const host =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const res = await fetch(
      `${host}/api/product-categories`,
      { cache: 'no-store' }
    );

    const categories: string[] = await res.json();
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function MenuPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category || 'all';

  const products = await getProducts(category);
  const categories = await getCategories();

  const categoryDisplay =
    category === 'all'
      ? 'All'
      : category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">

          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-4">
              Our <span className="text-amber-600">Menu</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore authentic Filipino dishes crafted with traditional recipes
              and premium ingredients
            </p>
          </div>

          {/* Category Tabs */}
          <CategoryTabs
            categories={categories}
            currentCategory={category}
          />

          {/* 🔍 FRONTEND SEARCH + PRODUCT LIST */}
          <MenuClient products={products} />

        </div>
      </main>

      <Footer />
    </div>
  );
}
