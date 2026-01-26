'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { User, Phone, Mail, Lock, ArrowLeft, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminHeader } from '@/components/admin-header';

export default function ProfilePage() {
  const { data: session, status, update } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/admin/profile');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: (session.user as any)?.name || '',
        phone: (session.user as any)?.phone || '',
      });
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Profile updated successfully!', {
          duration: 3000,
          style: {
            background: '#D1FAE5',
            border: '1px solid #10B981',
            color: '#065F46',
            fontWeight: 600,
          }
        });
        // Update the session with fresh data from database
        await update();
        // Force a small delay to ensure session is refreshed
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        toast.error(data.error || 'Failed to update profile', {
          duration: 3000,
          style: {
            background: '#FEE2E2',
            border: '1px solid #EF4444',
            color: '#991B1B',
            fontWeight: 600,
          }
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('An error occurred. Please try again.', {
        duration: 3000,
        style: {
          background: '#FEE2E2',
          border: '1px solid #EF4444',
          color: '#991B1B',
          fontWeight: 600,
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-amber-100">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                <div className="relative w-12 h-12">
                    <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-amber-900">Admin Panel</h1>
                    <p className="text-sm text-gray-600">Alexander's Cuisine</p>
                </div>
                </div>
                <div className="flex items-center space-x-4 relative">
                {/* Admin Name Button */}
                <button
                    onClick={() => setAdminMenuOpen((prev) => !prev)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <span className="text-sm text-gray-700 font-medium">
                    Welcome, Admin!
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
    
                {/* Dropdown */}
                {adminMenuOpen && (
                    <>
                    {/* Click outside overlay */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setAdminMenuOpen(false)}
                    />
                    </>
                )}
                </div>
            </div>
            </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
        </main>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
    <AdminHeader />
      <main className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 py-12">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center text-amber-700 hover:text-amber-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-6">
              <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
              <p className="text-amber-100">Manage your account information</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-2" />
                  Email Address
                </label>
                <Input
                  type="email"
                  value={(session.user as any)?.email || ''}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  Full Name
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className="border-2 border-gray-300 focus:border-amber-400"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-2" />
                  Phone Number
                </label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="09XX XXX XXXX"
                  className="border-2 border-gray-300 focus:border-amber-400"
                  disabled={loading}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 font-semibold"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Link
                  href="/admin/profile/change-password"
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <Lock className="w-5 h-5 mr-2" />
                  Change Password
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
