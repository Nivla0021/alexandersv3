import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: "Alexander's Handcrafted Cuisine - Authentic Filipino Food",
  description:
    'Order traditional Filipino snacks and dishes from Metro Manila. Turon, Calabasa Pansit, and more handcrafted favorites delivered to your door.',
  keywords:
    'Filipino food, turon, pansit, Filipino snacks, Metro Manila delivery, cloud kitchen',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: "Alexander's Handcrafted Cuisine",
    description: 'Authentic Filipino food delivered to Metro Manila',
    images: ['/og-image.png'],
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster 
            position="top-right"
            expand={false}
            richColors
            closeButton
          />
        </Providers>
      </body>
    </html>
  );
}
