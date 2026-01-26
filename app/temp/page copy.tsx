import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PrismaClient } from '@prisma/client';
import { ArrowRight, Truck, Clock, Star } from 'lucide-react';
import Carousel from "@/components/carousel";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { available: true },
      take: 4,
      orderBy: { createdAt: 'desc' },
    });
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function HomePage() {
  const slides = ["/img/pansit-kalabasa-010626.png", "/img/spring-rolls-010626b.png", "/img/meatballs-010626b.png"];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex flex-col gap-10">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-6 lg:py-10">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center lg:gap-10 gap-5">
          
          <Carousel slides={slides}  autoSlideInterval={4000} />

          {/* Promotional card images */}
          <div className="l-card h-full w-full gap-4 flex flex-wrap justify-center">
            <img src="/product_images/juice.png" alt="Lemon Tea Juice" className="w-full h-auto rounded-lg" />
            <img src="/product_images/lumpia.png" alt="Homemade Fried Lumpia" className="w-full h-auto rounded-lg" />
            <img src="/product_images/products-meatballs.png" alt="Fresh Meatballs Made Daily" className="w-full h-auto rounded-lg" />
            <img src="/product_images/products-pancit-kalabasa.png" alt="Pansit Kalabasa Noodles" className="w-full h-auto rounded-lg" />
          </div>
        </div>
        </section>

        

        {/* Features Section */}
        <section className="bg-white lg:mb-4 mb-1">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 lg:text-[18px] text-[12.5px] lg:gap-8 gap-4">
              <div className="text-center p-6 rounded-xl bg-amber-50 shadow-md hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 text-white rounded-full mb-4">
                  <Truck className="w-8 h-8" />
                </div>
                <p className="lg:text-xl text-[16px] font-bold text-amber-900 mb-2">
                  Metro Manila Delivery
                </p>
                <p className="text-gray-600 lg:px-0 px-8">
                  Fast and reliable delivery across all Metro Manila areas
                </p>
              </div>
              <div className="text-center p-6 rounded-xl bg-amber-50 shadow-md hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 text-white rounded-full mb-4">
                  <Clock className="w-8 h-8" />
                </div>
                <p className="lg:text-xl text-[16px] font-bold text-amber-900 mb-2">
                  Fresh Daily
                </p>
                <p className="text-gray-600 lg:px-0 px-8">
                  Made fresh in our cloud kitchen with quality ingredients
                </p>
              </div>
              <div className="text-center p-6 rounded-xl bg-amber-50 shadow-md hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 text-white rounded-full mb-4">
                  <Star className="w-8 h-8" />
                </div>
                <p className="lg:text-xl text-[16px] font-bold text-amber-900 mb-2">
                  Authentic Recipes
                </p>
                <p className="text-gray-600 lg:px-0 px-8">
                  Traditional Filipino flavors passed down through generations
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className=" bg-white">
          <div className="container flex flex-col lg:gap-10 gap-4 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 lg:text-[18px] text-[12.5px]">
            <div className="text-center ">
              <h2 className="text-xl md:text-4xl font-bold text-amber-900">
                What Our <span className="text-amber-600">Customers Say</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 lg:gap-8 gap-4">
              <div className="bg-amber-50 p-6 rounded-xl shadow-md">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-amber-500 fill-amber-500"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Best turon I've tasted! Reminds me of my lola's cooking.
                  Perfect crisp and sweetness."
                </p>
                <p className="font-semibold text-amber-900">- Maria Santos</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-xl shadow-md">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-amber-500 fill-amber-500"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "The Calabasa Pansit is amazing! So flavorful and fresh.
                  Delivery was quick too."
                </p>
                <p className="font-semibold text-amber-900">- Juan Dela Cruz</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-xl shadow-md">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-amber-500 fill-amber-500"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Love the Banana Turon Pie! Such a creative twist on
                  traditional Filipino desserts."
                </p>
                <p className="font-semibold text-amber-900">- Sofia Reyes</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-amber-600 to-orange-600">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Experience Authentic Filipino Flavors?
            </h2>
            <p className="text-xl text-amber-50 mb-8">
              Order now and get your favorites delivered fresh to your doorstep
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-amber-600 rounded-lg hover:bg-amber-50 transition-colors shadow-lg font-bold text-lg"
            >
              <span>Browse Menu</span>
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
