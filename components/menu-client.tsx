'use client';

import { useMemo, useState } from 'react';
import { ProductCard } from '@/components/product-card';

type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  available: boolean;
  category?: string;
  variants: { id: string; label: string; price: number }[];
};

export function MenuClient({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().startsWith(query) ||
        product.category?.toLowerCase().startsWith(query)
    );
  }, [search, products]);

  return (
    <>
      <div className="mb-8 max-w-xl mx-auto">
        <input
          type="text"
          placeholder="Search by name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3
                     focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-gray-600">
            No products match your search.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              description={product.description}
              image={product.image}
              available={product.available}
              variants={product.variants}
            />
          ))}
        </div>
      )}
    </>
  );
}
