'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Eye } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
}

export function ProductCard({
  id,
  name,
  description,
  price,
  image,
  available,
}: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const addItem = useCartStore((state) => state?.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation();
    if (!available) return;
    setIsAdding(true);
    addItem?.({ id, name, price, image });
    setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <Link href={`/menu/${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
      >
        <div className="relative aspect-square bg-gray-100">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {!available && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                Out of Stock
              </span>
            </div>
          )}
          {/* View Details Badge */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-4 h-4 text-amber-600" />
          </div>
        </div>
        <div className="p-5">
          <h3 className="text-xl font-bold text-amber-900 mb-2 group-hover:text-amber-600 transition-colors">{name}</h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-amber-700">₱{price}</span>
            {/* <button
              onClick={handleAddToCart}
              disabled={!available || isAdding}
              className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed z-10 relative"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isAdding ? 'Added!' : 'Add to Cart'}
              </span>
            </button> */}

            <div className="flex items-center">
              <span className="text-sm font-medium px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors cursor-pointer">
                View Details
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
