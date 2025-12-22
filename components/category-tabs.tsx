'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CategoryTabsProps {
  categories: string[];
  currentCategory: string;
}

export function CategoryTabs({ categories, currentCategory }: CategoryTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryChange = (category: string) => {
    if (category === 'all') {
      router.push('/menu');
    } else {
      router.push(`/menu?category=${category}`);
    }
  };

  // Format category names for display
  const formatCategory = (cat: string) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  return (
    <div className="mb-10">
      <div className="flex flex-wrap gap-3 justify-center">
        {/* All category button */}
        <Button
          onClick={() => handleCategoryChange('all')}
          variant={currentCategory === 'all' ? 'default' : 'outline'}
          className={cn(
            'px-6 py-2 rounded-full font-medium transition-all',
            currentCategory === 'all'
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md'
              : 'border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400'
          )}
        >
          All
        </Button>

        {/* Category buttons */}
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => handleCategoryChange(category)}
            variant={currentCategory === category ? 'default' : 'outline'}
            className={cn(
              'px-6 py-2 rounded-full font-medium transition-all',
              currentCategory === category
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md'
                : 'border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400'
            )}
          >
            {formatCategory(category)}
          </Button>
        ))}
      </div>
    </div>
  );
}
