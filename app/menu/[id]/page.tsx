'use client';

import { Header } from '@/components/header';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Minus, Plus, Store, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCartStore } from '@/lib/cart-store';
import { toast } from 'sonner';

interface Variant {
  id: string;
  label: string;
  price: number;
  inStorePrice: number | null;
  onlinePrice: number | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  recipe: string | null;
  image: string;
  category: string | null;
  available: boolean;
  productType: 'in-store' | 'online' | 'both';
  variants: Variant[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Fetch online products only
        const res = await fetch('/api/products/online');
        const data: Product[] = await res.json();
        const foundProduct = data.find((p) => p.id === params.id);
        
        if (foundProduct) {
          setProduct(foundProduct);
          setSelectedVariant(foundProduct.variants[0] || null);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setLoading(false);
      }
    };

    if (params.id) fetchProduct();
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    addItem(
      {
        id: product.id,
        name: product.name,
        price: selectedVariant.price,
        image: product.image,
        variantId: selectedVariant.id,
        variantLabel: selectedVariant.label,
        // Store additional info for reference
        productType: product.productType,
        priceType: 'online', // Track that this is an online purchase
      },
      quantity
    );

    toast.success(
      `${quantity} ${product.name} (${selectedVariant.label}) added to cart!`,
      {
        duration: 3000,
        style: {
          background: '#FEF3C7',
          border: '1px solid #FBBF24',
          color: '#92400E',
          fontWeight: 600,
        },
      }
    );
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
        <p className="text-gray-600 mb-6">This product may not be available for online ordering.</p>
        <Button onClick={() => router.push('/menu')}>Back to Menu</Button>
      </div>
    );
  }

  // Calculate if product has any online variants
  const hasOnlineVariants = product.variants.some(v => v.onlinePrice);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <Header />

      {/* Main Content */}
      <main className="pt-24">
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
                  {/* Category and Type */}
                  <div className="flex flex-wrap gap-2">
                    {product.category && (
                      <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                        {product.category}
                      </span>
                    )}
                    
                    {/* Availability Badge */}
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      product.available 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {product.available ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>

                  <h1 className="text-4xl font-bold text-gray-900">
                    {product.name}
                  </h1>

                  <div
                    className="text-gray-600 text-lg leading-relaxed prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />

                  {/* Variant Selector */}
                  {product.variants.length > 0 && (
                    <div className="mt-4">
                      <label className="text-gray-700 font-medium mb-2 block">
                        Select Size/Variant
                      </label>
                      <div className="space-y-2">
                        {product.variants.map((variant) => (
                          <button
                            key={variant.id}
                            onClick={() => setSelectedVariant(variant)}
                            className={`w-full p-3 border rounded-lg text-left transition-colors ${
                              selectedVariant?.id === variant.id
                                ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                                : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{variant.label}</span>
                              <span className="text-lg font-bold text-amber-600">
                                ₱{variant.price.toFixed(2)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Display */}
                  {selectedVariant && (
                    <div className="flex items-baseline gap-2 mt-4">
                      <span className="text-4xl font-bold text-amber-600">
                        ₱{(selectedVariant.price * quantity).toFixed(2)}
                      </span>
                      <span className="text-gray-500">
                        (₱{selectedVariant.price.toFixed(2)} each)
                      </span>
                    </div>
                  )}

                  {/* Add to Cart Section */}
                  {product.available && hasOnlineVariants ? (
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
                            disabled={quantity <= 1}
                            className="rounded-full border-amber-300 hover:bg-amber-100 disabled:opacity-50"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <span className="w-10 text-center text-lg font-semibold">
                            {quantity}
                          </span>

                          <Button
                            variant="outline"
                            size="icon"
                            disabled={quantity >= 99}
                            onClick={incrementQuantity}
                            className="rounded-full border-amber-300 hover:bg-amber-100 disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <Button
                        onClick={handleAddToCart}
                        disabled={!selectedVariant}
                        size="lg"
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-lg py-6 shadow-lg disabled:opacity-50"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart – ₱
                        {(selectedVariant ? selectedVariant.price * quantity : 0).toFixed(2)}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                      <p className="text-red-700 font-semibold mb-2">
                        Not Available for Online Order
                      </p>
                      <p className="text-sm text-gray-600">
                        This product is only available for in-store purchase.
                      </p>
                      <Button
                        onClick={() => router.push('/menu')}
                        variant="outline"
                        className="mt-4"
                      >
                        Browse Other Products
                      </Button>
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
                <h2 className="text-2xl font-bold text-amber-800 mb-6">
                  About This Product
                </h2>
                <div
                  className="prose prose-lg prose-amber max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.recipe }}
                />
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