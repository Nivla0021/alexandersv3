import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { ChevronDown, Settings, UserPlus, LogOut } from 'lucide-react';
import Link from 'next/link';
export function AdminHeader() {
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    const { data: session, status } = useSession() || {};
    return (
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
                  Welcome, {session?.user?.name}
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

                  <div className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-lg border z-20">
                    {/* Admin Info */}
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-semibold text-gray-900">
                        {session?.user?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session?.user?.email}
                      </p>
                    </div>
                    {/* Profile Settings */}
                    <Link
                      href="/admin/profile"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </Link>
                    {/* Logout */}
                    <button
                      onClick={() => signOut({ callbackUrl: '/admin/login' })}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    );
}