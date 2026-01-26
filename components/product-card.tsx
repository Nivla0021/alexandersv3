'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  image: string;
  available: boolean;
  variants: { id: string; label: string; price: number }[];
}

export function ProductCard({
  id,
  name,
  description,
  image,
  available,
  variants,
}: ProductCardProps) {
  // Always pick the first variant
  const firstVariant = variants[0];

  return (
    <Link href={`/menu/${id}`} className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="h-full bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col"
      >
        {/* Image */}
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

          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-4 h-4 text-amber-600" />
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3
            className="
              text-xl font-bold text-amber-900
              mb-2 group-hover:text-amber-600 transition-colors
              line-clamp-2
              min-h-[3.25rem]
            "
          >
            {name}
          </h3>

          <div
            className="text-sm text-gray-600 mb-4 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: description }}
          />

          <div className="mt-auto flex items-center justify-between">
            {/* Display first variant price */}
            {firstVariant && (
              <span className="text-2xl font-bold text-amber-700">
                ₱{firstVariant.price.toFixed(2)}
              </span>
            )}

            <span className="text-sm font-medium px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
              View Details
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
