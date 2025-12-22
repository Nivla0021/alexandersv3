'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Plus, Edit, Trash2, Package } from 'lucide-react';
import { useRef } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  recipe?: string | null;
  price: number;
  image: string;
  category: string | null;
  available: boolean;
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    recipe: '',
    price: '',
    image: '',
    category: '',
    available: true,
  });

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const categories = [
    { value: 'main-dishes', label: 'Main Dishes' },
    { value: 'noodles', label: 'Noodles' },
    { value: 'appetizers', label: 'Appetizers' },
    { value: 'soups', label: 'Soups' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'desserts', label: 'Desserts' },
  ];

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (
      status === 'unauthenticated' ||
      !(session?.user as any)?.role ||
      (session?.user as any)?.role !== 'admin'
    ) {
      router.push('/admin/login');
      return;
    }

    fetchProducts();
  }, [status, session, router]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      const data = await response.json();
      setProducts(data ?? []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formPayload = new FormData();
      if (editingProduct) formPayload.append('id', editingProduct.id);
      formPayload.append('name', formData.name);
      formPayload.append('description', formData.description);
      formPayload.append('recipe', formData.recipe || '');
      formPayload.append('price', formData.price);
      formPayload.append('category', formData.category || '');
      formPayload.append('available', formData.available ? 'true' : 'false');

      // If image is a File, append it; if it's a string (editing), skip
      if (formData.image && typeof formData.image !== 'string') {
        formPayload.append('image', formData.image);
      }

      const response = await fetch('/api/admin/products', {
        method: editingProduct ? 'PATCH' : 'POST',
        body: formPayload,
      });

      if (response.ok) {
        await fetchProducts();
        setShowForm(false);
        setEditingProduct(null);
        setFormData({
          name: '',
          description: '',
          recipe: '',
          price: '',
          image: '',
          category: '',
          available: true,
        });
      } else {
        const data = await response.json();
        console.error('Error saving product:', data.error);
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      recipe: product.recipe || '',
      price: product.price.toString(),
      image: product.image, // keep URL string for existing image
      category: product.category || '',
      available: product.available,
    });
    setShowForm(true);

    setTimeout(() => {
    formRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 0);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/admin/products?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProducts();
      } else {
        const data = await response.json();
        console.error('Error deleting product:', data.error);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const toggleAvailability = async (product: Product) => {
    try {
      await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          available: !product.available,
        }),
      });
      await fetchProducts();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  // Filtered products using debounced term
  const filteredProducts = products.filter((product) => {
    const term = debouncedTerm.toLowerCase();
    const nameMatch = product.name.toLowerCase().includes(term);
    const categoryMatch = product.category?.toLowerCase().includes(term);
    return nameMatch || categoryMatch;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-amber-100 mb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-amber-900" />
              </Link>
              <h1 className="text-2xl font-bold text-amber-900">Manage Products</h1>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingProduct(null);
                setFormData({
                  name: '',
                  description: '',
                  recipe: '',
                  price: '',
                  image: '',
                  category: '',
                  available: true,
                });
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {showForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8"
            ref={formRef}
          >
            <h2 className="text-xl font-bold text-amber-900 mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price (₱) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Recipe *
                </label>
                <textarea
                  required
                  value={formData.recipe}
                  onChange={(e) =>
                    setFormData({ ...formData, recipe: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Image *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    required={!editingProduct} // required if adding new product
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFormData({ ...formData, image: e.target.files[0] as any });
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  {/* Preview */}
                  {formData.image && typeof formData.image !== 'string' && (
                    <img
                      src={URL.createObjectURL(formData.image)}
                      alt="Preview"
                      className="mt-2 w-32 h-32 object-cover rounded"
                    />
                  )}
                  {/* If editing and image is a URL */}
                  {formData.image && typeof formData.image === 'string' && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="mt-2 w-32 h-32 object-cover rounded"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                              focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  >
                    <option value="" disabled>
                      Select category
                    </option>

                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) =>
                    setFormData({ ...formData, available: e.target.checked })
                  }
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="available" className="ml-2 text-sm text-gray-700">
                  Available for order
                </label>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products List */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-amber-900 flex items-center">
              <Package className="w-6 h-6 mr-2" />
              Products ({filteredProducts.length})
            </h2>
            <input
              type="text"
              placeholder="Search by name or category"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none w-64"
            />
          </div>
          <div className="divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                No products found.
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div key={product?.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image
                        src={product?.image ?? ''}
                        alt={product?.name ?? 'Product'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {product?.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {product?.description}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {product?.recipe}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-lg font-bold text-amber-600">
                              ₱{product?.price}
                            </span>
                            {product?.category && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {product?.category}
                              </span>
                            )}
                            <button
                              onClick={() => toggleAvailability(product)}
                              className={`text-xs px-3 py-1 rounded-full font-medium ${
                                product?.available
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {product?.available ? 'Available' : 'Unavailable'}
                            </button>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product?.id ?? '')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
