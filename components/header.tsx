'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Menu as MenuIcon, X, User, LogOut, LogIn, Package } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session, status } = useSession() || {};

  // ✅ Subscribe to items (reactive)
  const items = useCartStore((state) => state.items);

  // ✅ Derived value
  const totalItems = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/menu', label: 'Menu' },
    { href: '/about', label: 'About' },
    { href: '/delivery-info', label: 'Delivery' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-amber-100 shadow-sm">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative w-12 h-12">
              <Image
                src="/logo.png"
                alt="Alexander's Handcrafted Cuisine Logo"
                fill
                className="object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-amber-900">
                Alexander's
              </span>
              <br />
              <span className="text-xs text-amber-700">
                Handcrafted Cuisine
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-amber-900 hover:bg-amber-50 hover:text-amber-700 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User Menu, Cart & Mobile Menu */}
          <div className="flex items-center space-x-2">
            {/* User Menu - Desktop */}
            {mounted && status !== 'loading' && (
              <>
                {session ? (
                  <div className="hidden md:block relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg text-amber-900 hover:bg-amber-50 transition-colors"
                    >
                      <User className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {(session.user as any)?.name?.split(' ')[0] || 'Account'}
                      </span>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {userMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setUserMenuOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-amber-100 py-2 z-20">
                          <div className="px-4 py-2 border-b border-amber-100">
                            <p className="text-sm font-semibold text-gray-900">
                              {(session.user as any)?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(session.user as any)?.email}
                            </p>
                          </div>
                          <Link
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="w-full text-left px-4 py-2 text-sm text-amber-900 hover:bg-amber-50 flex items-center space-x-2"
                          >
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                          </Link>
                          <Link
                            href="/orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="w-full text-left px-4 py-2 text-sm text-amber-900 hover:bg-amber-50 flex items-center space-x-2"
                          >
                            <Package className="w-4 h-4" />
                            <span>My Orders</span>
                          </Link>
                          <button
                            onClick={() => {
                              signOut({
                                callbackUrl: process.env.NEXT_PUBLIC_BASE_URL,
                              });
                              setUserMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/auth/login"
                    className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg text-amber-900 hover:bg-amber-50 transition-colors"
                  >
                    <LogIn className="w-5 h-5" />
                    <span className="text-sm font-medium">Login</span>
                  </Link>
                )}
              </>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />

              {mounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-amber-900 hover:bg-amber-50"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 space-y-2 border-t border-amber-100">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-lg text-sm font-medium text-amber-900 hover:bg-amber-50"
              >
                {link.label}
              </Link>
            ))}
            
            {/* Mobile User Menu */}
            <div className="border-t border-amber-100 pt-2 mt-2">
              {session ? (
                <>
                  <div className="px-4 py-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {(session.user as any)?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(session.user as any)?.email}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50 flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      signOut({
                        callbackUrl: process.env.NEXT_PUBLIC_BASE_URL,
                      });
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50 flex items-center space-x-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
