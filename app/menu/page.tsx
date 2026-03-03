import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CategoryTabs } from '@/components/category-tabs';
import { MenuClient } from '@/components/menu-client';

export const dynamic = 'force-dynamic';

// ------- PRODUCT TYPE (UPDATED WITH ONLINE PRICING) -------
type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  available: boolean;
  category?: string;
  productType: 'in-store' | 'online' | 'both'; // New field
  variants: {
    id: string;
    label: string;
    inStorePrice: number | null;
    onlinePrice: number | null;
  }[];
};

// ------- FETCH PRODUCTS (FILTERED FOR ONLINE AVAILABILITY) -------
async function getProducts(category?: string): Promise<Product[]> {
  try {
    const host =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const res = await fetch(
      `${host}/api/products?category=${category || ''}`,
      { cache: 'no-store' }
    );

    const products = await res.json();
    console.log('Fetched products:', products);

    // Filter products that are available online (productType = 'online' or 'both')
    // AND have at least one variant with onlinePrice
    const onlineProducts = (products ?? [])
      .filter((p: any) => {
        // Check if product is available online
        const isOnlineAvailable = 
          p.productType === 'online' || 
          p.productType === 'both';
        
        // Check if product has at least one variant with online price
        const hasOnlineVariant = p.variants?.some(
          (v: any) => v.onlinePrice && v.onlinePrice > 0
        );

        return isOnlineAvailable && hasOnlineVariant && p.available;
      })
      .map((p: any) => ({
        ...p,
        // Only include variants that have online prices
        variants: p.variants
          ?.filter((v: any) => v.onlinePrice && v.onlinePrice > 0)
          .map((v: any) => ({
            ...v,
            // Use onlinePrice for the menu display
            price: parseFloat(v.onlinePrice),
            inStorePrice: v.inStorePrice ? parseFloat(v.inStorePrice) : null,
            onlinePrice: v.onlinePrice ? parseFloat(v.onlinePrice) : null,
          })) ?? [],
      }));

    return onlineProducts;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// ------- FETCH CATEGORIES (ONLY FROM ONLINE PRODUCTS) -------
async function getCategories() {
  try {
    const host =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Fetch all products first to get categories from online products
    const res = await fetch(
      `${host}/api/products`,
      { cache: 'no-store' }
    );

    const products = await res.json();
    
    // Extract unique categories from online products
    const onlineCategories = (products ?? [])
      .filter((p: any) => 
        (p.productType === 'online' || p.productType === 'both') && 
        p.available &&
        p.category &&
        p.variants?.some((v: any) => v.onlinePrice && v.onlinePrice > 0)
      )
      .map((p: any) => p.category)
      .filter((category: string, index: number, self: string[]) => 
        category && self.indexOf(category) === index
      )
      .sort();

    return onlineCategories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Helper function to get category display name
function getCategoryDisplay(category: string): string {
  if (category === 'all') return 'All';
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default async function MenuPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category || 'all';
  
  // Fetch products (will be filtered for online)
  const products = await getProducts(category === 'all' ? undefined : category);
  
  // Fetch categories (only from online products)
  const categories = await getCategories();

  const categoryDisplay = getCategoryDisplay(category);

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
            
            {/* Online Shopping Indicator */}
            <div className="mt-4 inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                />
              </svg>
              <span className="text-sm font-medium">Available for Online Order</span>
            </div>
          </div>

          {/* Category Tabs - Only show categories with online products */}
          {categories.length > 0 ? (
            <CategoryTabs
              categories={categories}
              currentCategory={category}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No categories available</p>
            </div>
          )}

          {/* Product Display */}
          {products.length > 0 ? (
            <MenuClient products={products} />
          ) : (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <div className="max-w-md mx-auto">
                <svg 
                  className="w-24 h-24 text-gray-300 mx-auto mb-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No Online Products Available
                </h3>
                <p className="text-gray-500">
                  {category === 'all' 
                    ? "We're currently preparing our online menu. Please check back later or visit our store."
                    : `No online products available in ${categoryDisplay} category.`}
                </p>
                {category !== 'all' && (
                  <button
                    onClick={() => window.location.href = '/menu'}
                    className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    View All Products
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}