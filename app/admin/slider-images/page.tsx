'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Plus, Edit, Trash2, Package } from 'lucide-react';
import { useRef } from 'react';
import { Editor } from "@tinymce/tinymce-react";


interface ProductImages {
  id: string;
  name: string;
  image: string;
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [productImages, setProductImages] = useState<ProductImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductImages | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    image: '',
  });


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

    fetchSliderImages();
  }, [status, session, router]);

  const fetchSliderImages = async () => {
    try {
      const response = await fetch('/api/admin/slider-images');
      const data = await response.json();
      setProductImages(data ?? []);
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

      // If image is a File, append it; if it's a string (editing), skip
      if (formData.image && typeof formData.image !== 'string') {
        formPayload.append('image', formData.image);
      }

      const response = await fetch('/api/admin/slider-images', {
        method: editingProduct ? 'PATCH' : 'POST',
        body: formPayload,
      });

      if (response.ok) {
        await fetchSliderImages();
        setShowForm(false);
        setEditingProduct(null);
        setFormData({
          name: '',
          image: '',
        });
      } else {
        const data = await response.json();
        console.error('Error saving product:', data.error);
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product: ProductImages) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      image: product.image, // keep URL string for existing image
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
      const response = await fetch(`/api/admin/slider-images?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSliderImages();
      } else {
        const data = await response.json();
        console.error('Error deleting product:', data.error);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };


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
              <h1 className="text-2xl font-bold text-amber-900">Manage Slider Images</h1>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingProduct(null);
                setFormData({
                  name: '',
                  image: '',
                });
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Slider Images</span>
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
                    Slider Name *
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
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {editingProduct ? 'Update Image Slide' : 'Add Image Slide'}
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
          <div className="divide-y divide-gray-200">
              {productImages.map((product) => (
                <div key={product?.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <Image
                        src={product?.image || "/placeholder.png"}
                        alt={product?.name ?? "Product"}
                        fill
                        className="object-cover"
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                        <h3 className="text-lg font-bold text-gray-900">{product?.name}</h3>

                        <div className="flex space-x-2">
                            <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                            <Edit className="w-5 h-5" />
                            </button>

                            <button
                            onClick={() => handleDelete(product?.id ?? "")}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                            <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                        </div>
                    </div>
                    </div>
                </div>
                ))}
          </div>
        </div>
      </main>
    </div>
  );
}
