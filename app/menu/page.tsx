import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProductCard } from '@/components/product-card';
import { PrismaClient } from '@prisma/client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { CategoryTabs } from '@/components/category-tabs';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// ------- ADDED PRODUCT TYPE -------
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category?: string;
};

// ------- UPDATED FUNCTION WITH RETURN TYPE -------
async function getProducts(category?: string): Promise<Product[]> {
  try {
    const host = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${host}/api/products?category=${category}`, {
      cache: "no-store",
    });
    const products: Product[] = await res.json();
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}
//update

async function getCategories() {
  try {
    const categories = await prisma.product.findMany({
      where: { available: true },
      select: { category: true },
      distinct: ['category'],
    });
    return categories
      .map((c: { category: string | null }) => c.category)
      .filter((cat: string | null): cat is string => cat !== null && cat !== undefined);
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
  const products = await getProducts(category); // now typed as Product[]
  const categories = await getCategories();

  const categoryDisplay = category === 'all'
    ? 'All'
    : category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">

          {/* Breadcrumbs */}
          <div className="mb-8">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="text-amber-700 hover:text-amber-900">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/menu" className="text-amber-700 hover:text-amber-900">
                    Menu
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {category !== 'all' && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-amber-900 font-semibold">
                        {categoryDisplay}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header */}
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

          {/* Products */}
          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-gray-600">
                No products available in this category.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  description={product.description}
                  price={product.price}
                  image={product.image}
                  available={product.available}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
