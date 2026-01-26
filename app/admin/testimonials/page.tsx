'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2, MessageSquare } from 'lucide-react';
import { Editor } from "@tinymce/tinymce-react";
import { SafeHTML } from '@/lib/safe-html';

interface Testimonial {
  id: string;
  customerName: string;
  message: string;
}

const MIN_LENGTH = 10;
const MAX_LENGTH = 300;

export default function AdminTestimonialsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    message: '',
  });

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Fetch testimonials & auth check
  useEffect(() => {
    if (status === 'loading') return;

    if (
      status === 'unauthenticated' ||
      (session?.user as any)?.role !== 'admin'
    ) {
      router.push('/admin/login');
      return;
    }

    fetchTestimonials();
  }, [status, session]);

  const fetchTestimonials = async () => {
    try {
      const res = await fetch('/api/admin/testimonials');
      const data = await res.json();
      setTestimonials(data ?? []);
    } catch (err) {
      console.error('Failed to fetch testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate message length
    if (
      formData.message.length < MIN_LENGTH ||
      formData.message.length > MAX_LENGTH
    ) {
      alert(
        `Message must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`
      );
      return;
    }

    const payload = {
      id: editingItem?.id,
      customerName: formData.customerName,
      message: formData.message,
    };

    try {
      const res = await fetch('/api/admin/testimonials', {
        method: editingItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchTestimonials();
        setShowForm(false);
        setEditingItem(null);
        setFormData({ customerName: '', message: '' });
      } else {
        const error = await res.json();
        alert(error?.error || 'Save failed');
      }
    } catch (err) {
      console.error('Error saving testimonial:', err);
    }
  };

  const handleEdit = (item: Testimonial) => {
    setEditingItem(item);
    setFormData({
      customerName: item.customerName,
      message: item.message,
    });
    setShowForm(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;

    try {
      await fetch(`/api/admin/testimonials?id=${id}`, { method: 'DELETE' });
      await fetchTestimonials();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const filtered = testimonials.filter((t) =>
    t.customerName.toLowerCase().includes(debouncedTerm.toLowerCase())
  );

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
              <h1 className="text-2xl font-bold text-amber-900">
                Manage Testimonials
              </h1>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingItem(null);
                setFormData({ customerName: '', message: '' });
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Testimonial</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8" ref={formRef}>
            <h2 className="text-xl font-bold text-amber-900 mb-4">
              {editingItem ? 'Edit Testimonial' : 'Add New Testimonial'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Testimonial *
                </label>
                <Editor
                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                    value={formData.message}
                    onEditorChange={(content: string) =>
                        setFormData({ ...formData, message: content })
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
                <p
                  className={`text-sm mt-1 ${
                    formData.message.length > MAX_LENGTH ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  {formData.message.length} / {MAX_LENGTH} characters
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  {editingItem ? 'Update Testimonial' : 'Add Testimonial'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-amber-900 flex items-center">
              <MessageSquare className="w-6 h-6 mr-2" />
              Testimonials ({filtered.length})
            </h2>
            <input
              type="text"
              placeholder="Search by customer name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none w-64"
            />
          </div>

          <div className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
                <div className="p-8 text-center text-gray-600">
                No testimonials found.
                </div>
            ) : (
                filtered.map((item) => (
                <div
                    key={item.id}
                    className="p-6 hover:bg-gray-50 transition-colors rounded-lg flex flex-col md:flex-row md:justify-between md:items-start gap-4"
                >
                    <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                        {item.customerName}
                    </h3>
                    <SafeHTML
                        html={item.message}
                        className="text-sm text-gray-600 mt-1 prose prose-sm max-w-none line-clamp-2"
                    />
                    </div>

                    <div className="flex space-x-2 flex-shrink-0 mt-2 md:mt-0">
                    <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <Edit className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
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
