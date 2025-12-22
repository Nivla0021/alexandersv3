import Link from 'next/link';
import { Facebook, Instagram, Mail, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-amber-950 text-amber-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-amber-200">
              Alexander's Handcrafted Cuisine
            </h3>
            <p className="text-sm text-amber-100 leading-relaxed">
              Authentic Filipino snacks and dishes made with love and tradition.
              Serving Metro Manila with homemade quality.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-amber-200">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/menu"
                  className="text-amber-100 hover:text-amber-300 transition-colors"
                >
                  Menu
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-amber-100 hover:text-amber-300 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-amber-100 hover:text-amber-300 transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-amber-200">Contact Us</h3>
            <ul className="space-y-3 text-sm text-amber-100">
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>sales@avasiaonline.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Metro Manila Only</span>
              </li>
            </ul>
            <div className="flex space-x-3 mt-4">
              <a
                href="#"
                className="p-2 bg-amber-900 rounded-lg hover:bg-amber-800 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-amber-900 rounded-lg hover:bg-amber-800 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-amber-900 text-center text-sm text-amber-200">
          <p>&copy; {new Date().getFullYear()} Alexander's Handcrafted Cuisine. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
