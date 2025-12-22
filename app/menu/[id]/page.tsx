// app/product/[id]/page.tsx
'use client';

import { Header } from '@/components/header';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Minus, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCartStore } from '@/lib/cart-store';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string;
  recipe: string | null;
  price: number;
  image: string;
  category: string | null;
  available: boolean;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        const foundProduct = data.find((p: Product) => p.id === params.id);
        if (foundProduct) setProduct(foundProduct);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setLoading(false);
      }
    };

    if (params.id) fetchProduct();
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;

    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      },
      quantity
    );

    toast.success(`${quantity} ${product.name} added to cart!`, {
      duration: 3000,
      style: {
        background: '#FEF3C7',
        border: '1px solid #FBBF24',
        color: '#92400E',
        fontWeight: 600,
      }
    });
  };

  const incrementQuantity = () => setQuantity((q) => q + 1);
  const decrementQuantity = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <Button onClick={() => router.push('/menu')}>Back to Menu</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <Header />

      {/* Main Content */}
      <main className="pt-24">
        {/* Product Hero */}
        <div className="container mx-auto px-4 pb-12">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.push('/menu')}
            className="mb-6 hover:bg-amber-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>

          <div className="grid md:grid-cols-2 gap-10 items-start">
            {/* Product Image */}
            <div className="relative aspect-square max-w-xl mx-auto md:mx-0 rounded-xl overflow-hidden shadow-xl">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Product Info */}
            <div className="md:sticky md:top-28">
              <Card className="border-2 border-amber-200 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  {product.category && (
                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                      {product.category}
                    </span>
                  )}

                  <h1 className="text-4xl font-bold text-gray-900">
                    {product.name}
                  </h1>

                  <p className="text-gray-600 text-lg leading-relaxed">
                    {product.description}
                  </p>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-amber-600">
                      ₱{product.price}
                    </span>
                  </div>

                  {product.available ? (
                    <div className="space-y-4 pt-2">
                      {/* Quantity */}
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-gray-700">
                          Quantity
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={decrementQuantity}
                            className="rounded-full border-amber-300 hover:bg-amber-100"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <span className="w-10 text-center text-lg font-semibold">
                            {quantity}
                          </span>

                          <Button
                            variant="outline"
                            size="icon"
                            onClick={incrementQuantity}
                            className="rounded-full border-amber-300 hover:bg-amber-100"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Add to Cart */}
                      <Button
                        onClick={handleAddToCart}
                        size="lg"
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-lg py-6 shadow-lg"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart – ₱
                        {(product.price * quantity).toFixed(2)}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <p className="text-red-700 font-semibold">
                        Currently Unavailable
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Recipe Section */}
        {product.recipe && (
          <div className="container mx-auto px-4 py-12">
            <Card className="border-2 border-amber-200 shadow-lg">
              <CardContent className="p-8 md:p-12">
                <div className="prose prose-lg prose-amber max-w-none">
                  <ReactMarkdown>{product.recipe}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="container mx-auto px-4 py-10 text-center">
          <Button
            onClick={() => router.push('/menu')}
            variant="outline"
            size="lg"
            className="border-2 border-amber-400 hover:bg-amber-50"
          >
            View More Products
          </Button>
        </div>
      </main>
    </div>
  );
}
