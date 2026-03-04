'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Plus, Edit, Trash2, Package, Store, Globe } from 'lucide-react';
import { useRef } from 'react';
import { Editor } from "@tinymce/tinymce-react";

interface ProductVariant {
  id: string;
  label: string;
  inStorePrice: number | null;
  onlinePrice: number | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  recipe?: string | null;
  image: string;
  category: string | null;
  available: boolean;
  featured: boolean;
  productType: 'in-store' | 'online' | 'both';
  variants: ProductVariant[];
}

type Category = {
  value: string;
  label: string;
};

export default function AdminProductsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    recipe: '',
    image: '',
    category: '',
    available: true,
    featured: false,
    productType: 'both' as 'in-store' | 'online' | 'both',
    variants: [{ 
      label: 'Regular', 
      inStorePrice: '', 
      onlinePrice: '' 
    }],
  });

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  
  // Filter state for product type
  const [typeFilter, setTypeFilter] = useState<'all' | 'in-store' | 'online' | 'both'>('all');

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

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
    loadCategories();
  }, [status, session, router]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();

      // Map variants to ensure prices are strings for the form
      const productsWithVariants = (data ?? []).map((product: any) => ({
        ...product,
        // ✅ FIXED: Map database 'in_store' to frontend 'in-store'
        productType: product.productType === 'in_store' 
          ? 'in-store' as const
          : product.productType === 'in-store' 
            ? 'in-store' as const
            : product.productType === 'online' 
              ? 'online' as const
              : 'both' as const,
        variants: product.variants?.map((v: any) => ({
          ...v,
          inStorePrice: v.inStorePrice?.toString() || '',
          onlinePrice: v.onlinePrice?.toString() || '',
        })) ?? [{ 
          label: 'Regular', 
          inStorePrice: '', 
          onlinePrice: '' 
        }],
      }));

      setProducts(productsWithVariants);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  async function loadCategories() {
    try {
      const res = await fetch('/api/admin/settings/categories');
      const data = await res.json();
      if (data?.value && Array.isArray(data.value)) {
        const mapped = data.value.map((item: any) => ({
          value: item.id,
          label: item.label,
        }));
        setCategories(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }

  const validateForm = () => {
    // Check if product has a name
    if (!formData.name.trim()) {
      alert('Please enter a product name');
      return false;
    }

    // Check if at least one variant exists with required prices
    if (formData.variants.length === 0) {
      alert('Please add at least one variant');
      return false;
    }

    // Check if each variant has required prices based on product type
    for (const variant of formData.variants) {
      if (!variant.label.trim()) {
        alert('Please enter a label for all variants');
        return false;
      }

      if (formData.productType === 'both') {
        if (!variant.inStorePrice || !variant.onlinePrice) {
          alert('For "Both" product type, each variant must have both in-store and online prices');
          return false;
        }
      } else if (formData.productType === 'in-store') {
        if (!variant.inStorePrice) {
          alert('For in-store products, each variant must have an in-store price');
          return false;
        }
      } else if (formData.productType === 'online') {
        if (!variant.onlinePrice) {
          alert('For online products, each variant must have an online price');
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const formPayload = new FormData();
      if (editingProduct) formPayload.append('id', editingProduct.id);
      formPayload.append('name', formData.name);
      formPayload.append('description', formData.description);
      formPayload.append('recipe', formData.recipe || '');
      formPayload.append('category', formData.category || '');
      formPayload.append('available', formData.available ? 'true' : 'false');
      formPayload.append('featured', formData.featured ? 'true' : 'false');
      formPayload.append('productType', formData.productType);
      
      // Transform variants to include both prices
      const variantsForApi = formData.variants.map(v => ({
        label: v.label,
        inStorePrice: v.inStorePrice ? parseFloat(v.inStorePrice) : null,
        onlinePrice: v.onlinePrice ? parseFloat(v.onlinePrice) : null,
      }));
      formPayload.append('variants', JSON.stringify(variantsForApi));

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
          image: '',
          category: '',
          available: true,
          featured: false,
          productType: 'both',
          variants: [{ label: 'Regular', inStorePrice: '', onlinePrice: '' }],
        });
      } else {
        const data = await response.json();
        console.error('Error saving product:', data.error);
        alert('Error saving product: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      recipe: product.recipe || '',
      image: product.image,
      category: product.category || '',
      available: product.available,
      featured: product.featured,
      // ✅ FIXED: Ensure product type is in the correct format for the form
      productType: product.productType,
      variants: product.variants.map((v) => ({
        label: v.label,
        inStorePrice: v.inStorePrice?.toString() || '',
        onlinePrice: v.onlinePrice?.toString() || '',
      })),
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

  const toggleFeatured = async (product: Product) => {
    try {
      await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          featured: !product.featured,
        }),
      });
      await fetchProducts();
    } catch (error) {
      console.error('Error toggling featured status:', error);
    }
  };

  // Filtered products using debounced term and type filter
  const filteredProducts = products.filter((product) => {
    const term = debouncedTerm.toLowerCase();
    const nameMatch = product.name.toLowerCase().includes(term);
    const categoryMatch = product.category?.toLowerCase().includes(term);
    const searchMatch = nameMatch || categoryMatch;
    
    // Apply type filter
    if (typeFilter === 'all') return searchMatch;
    return searchMatch && product.productType === typeFilter;
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
                  image: '',
                  category: '',
                  available: true,
                  featured: false,
                  productType: 'both',
                  variants: [{ label: 'Regular', inStorePrice: '', onlinePrice: '' }],
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
          <div className="bg-white rounded-xl shadow-md p-6 mb-8" ref={formRef}>
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

                {/* Product Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Type *
                  </label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="productType"
                        value="both"
                        checked={formData.productType === 'both'}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          productType: e.target.value as 'in-store' | 'online' | 'both' 
                        })}
                        className="w-4 h-4 text-amber-600"
                      />
                      <span className="text-sm text-gray-700">Both</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="productType"
                        value="in-store"
                        checked={formData.productType === 'in-store'}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          productType: e.target.value as 'in-store' | 'online' | 'both' 
                        })}
                        className="w-4 h-4 text-amber-600"
                      />
                      <span className="text-sm text-gray-700">In-store Only</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="productType"
                        value="online"
                        checked={formData.productType === 'online'}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          productType: e.target.value as 'in-store' | 'online' | 'both' 
                        })}
                        className="w-4 h-4 text-amber-600"
                      />
                      <span className="text-sm text-gray-700">Online Only</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Variants Section with Dual Prices */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pricing Options *
                </label>

                <div className="space-y-4">
                  {formData.variants.map((variant, index) => (
                    <div key={index} className="border p-4 rounded-lg bg-gray-50">
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="Label (e.g. Regular, 6 pcs)"
                          value={variant.label}
                          onChange={(e) => {
                            const updated = [...formData.variants];
                            updated[index].label = e.target.value;
                            setFormData({ ...formData, variants: updated });
                          }}
                          className="flex-1 px-3 py-2 border rounded-lg"
                          required
                        />
                        
                        {formData.variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.variants.filter((_, i) => i !== index);
                              setFormData({ ...formData, variants: updated });
                            }}
                            className="px-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* In-store Price */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            In-store Price {formData.productType !== 'online' ? '*' : '(optional)'}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={variant.inStorePrice}
                            onChange={(e) => {
                              const updated = [...formData.variants];
                              updated[index].inStorePrice = e.target.value;
                              setFormData({ ...formData, variants: updated });
                            }}
                            className={`w-full px-3 py-2 border rounded-lg ${
                              formData.productType === 'online' ? 'bg-gray-100' : ''
                            }`}
                            required={formData.productType !== 'online'}
                            disabled={formData.productType === 'online'}
                          />
                        </div>

                        {/* Online Price */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Online Price {formData.productType !== 'in-store' ? '*' : '(optional)'}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={variant.onlinePrice}
                            onChange={(e) => {
                              const updated = [...formData.variants];
                              updated[index].onlinePrice = e.target.value;
                              setFormData({ ...formData, variants: updated });
                            }}
                            className={`w-full px-3 py-2 border rounded-lg ${
                              formData.productType === 'in-store' ? 'bg-gray-100' : ''
                            }`}
                            required={formData.productType !== 'in-store'}
                            disabled={formData.productType === 'in-store'}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        variants: [...formData.variants, { 
                          label: '', 
                          inStorePrice: '', 
                          onlinePrice: '' 
                        }],
                      })
                    }
                    className="text-sm text-amber-700 hover:underline"
                  >
                    + Add Variant
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <Editor
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  value={formData.description}
                  onEditorChange={(content: string) =>
                    setFormData({ ...formData, description: content })
                  }
                  init={{
                    height: 300,
                    menubar: false,
                    plugins: [
                      "lists",
                      "link",
                      "autolink",
                      "preview",
                      "code",
                    ],
                    toolbar:
                      "undo redo | bold italic underline | bullist numlist | link | code",
                    content_style:
                      "body { font-family: Inter, sans-serif; font-size: 14px }",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Benefits / Recipe
                </label>
                <Editor
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  value={formData.recipe}
                  onEditorChange={(content: string) =>
                    setFormData({ ...formData, recipe: content })
                  }
                  init={{
                    height: 300,
                    menubar: false,
                    plugins: [
                      "lists",
                      "autolink",
                      "preview",
                      "code",
                    ],
                    toolbar:
                      "undo redo | bold italic | bullist numlist | code",
                  }}
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
                    required={!editingProduct}
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

              <div className="flex items-center space-x-6">
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
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData({ ...formData, featured: e.target.checked })
                    }
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                    Featured Product
                  </label>
                </div>
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
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-bold text-amber-900 flex items-center">
                <Package className="w-6 h-6 mr-2" />
                Products ({filteredProducts.length})
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="both">Both</option>
                  <option value="in-store">In-store Only</option>
                  <option value="online">Online Only</option>
                </select>

                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search by name or category"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none w-full sm:w-64"
                />
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                No products found.
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product?.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
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

                          <div
                            className="text-sm text-gray-600 mt-1 prose prose-sm max-w-none line-clamp-2"
                            dangerouslySetInnerHTML={{
                              __html: product?.description ?? '',
                            }}
                          />

                          {/* Variants Display with Type Badge and Price Split */}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            {/* Product Type Badge */}
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                              product.productType === 'both' 
                                ? 'bg-purple-100 text-purple-700'
                                : product.productType === 'in-store'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {product.productType === 'both' ? (
                                <>
                                  <Store className="w-3 h-3" />
                                  <Globe className="w-3 h-3" />
                                </>
                              ) : product.productType === 'in-store' ? (
                                <Store className="w-3 h-3" />
                              ) : (
                                <Globe className="w-3 h-3" />
                              )}
                              <span>
                                {product.productType === 'both' ? 'In-store & Online' : 
                                 product.productType === 'in-store' ? 'In-store Only' : 'Online Only'}
                              </span>
                            </span>

                            {/* Variant Prices */}
                            {product?.variants.map((variant) => (
                              <div key={variant.id} className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">
                                  {variant.label}:
                                </span>
                                
                                {(product.productType === 'both' || product.productType === 'in-store') && variant.inStorePrice && (
                                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                                    <Store className="w-3 h-3" />
                                    ₱{variant.inStorePrice}
                                  </span>
                                )}
                                
                                {(product.productType === 'both' || product.productType === 'online') && variant.onlinePrice && (
                                  <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    ₱{variant.onlinePrice}
                                  </span>
                                )}
                              </div>
                            ))}

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

                            <button
                              onClick={() => toggleFeatured(product)}
                              className={`text-xs px-3 py-1 rounded-full font-medium ${
                                product?.featured
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {product?.featured ? 'Featured' : 'Not Featured'}
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