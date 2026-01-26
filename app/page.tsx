import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ArrowRight, Truck, Clock, Star } from 'lucide-react';
import Carousel from "@/components/carousel";
import TestimonialsSlider from '@/components/testimonials-slider';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';


export const dynamic = 'force-dynamic';
const session = await getServerSession(authOptions);


export default async function HomePage() {
  if (session?.user) {
    const userRole = (session.user as any)?.role;
    
    // 3. Redirect based on role
    if (userRole === 'admin') {
      console.log(userRole);
      redirect('/admin/dashboard');  // Admin → Dashboard
    }else if (userRole === 'store-manager') {
      redirect('/store-manager/dashboard');  // Store Manager → Dashboard
    } 
  }

  


  async function getImageSlides() {
  try {
    const host =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const res = await fetch(
      `${host}/api/admin/slider-images`,
      { cache: 'no-store' }
    );
    
    if (!res.ok) throw new Error('Failed to fetch slider images');
    return await res.json();
  } catch (error) {
    console.error('Error fetching slider images:', error);
    return [];
  }
} 

async function getTestimonials() {
  try {
    const host =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const res = await fetch(
      `${host}/api/admin/testimonials`,
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error('Failed to fetch testimonials');
    return await res.json();
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}   

async function getFeaturedProducts() {
  try {
    const host =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const res = await fetch(
      `${host}/api/admin/featured-products`,
      { cache: 'no-store' }
    );
    
    if (!res.ok) throw new Error('Failed to fetch testimonials');
    return await res.json();
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}   
  const featuredProducts = await getFeaturedProducts();
  const testimonials = await getTestimonials();
  const sliderImages = await getImageSlides();
  const slides = sliderImages.map((img: any) => img.image);

  return (
    <div className="min-h-screen flex flex-col text-[#333333]">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-10 bg-[#ECF0ED]">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-10">
            
            <Carousel slides={slides}  autoSlideInterval={4000} />
            {/* <Carousel desktopSlides={desktopSlides} mobileSlides={mobileSlides} width={1200} height={600} autoSlideInterval={4000}/> */}


            {/* Promotional card images */}
            <div className="l-card h-full w-full gap-4 flex flex-wrap justify-center">
              {featuredProducts?.length > 0 ? (
                featuredProducts.map(( prod, idx) => (
                  <img
                    key={idx}
                    src={prod.image}
                    alt={prod.name || `Featured Product ${idx + 1}`}
                    className="w-full h-auto rounded-lg"
                  />
                ))
              ) : (
                <p className="text-gray-500 text-center w-full">
                  No featured product available
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 py-10 rounded-xl bg-[#FCFFFB] shadow-[0.9px_1.8px_1.8px_-0.9px_rgba(0,0,0,0.25)] hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#436B48] text-white rounded-full mb-4">
                  <Truck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-medium mb-2">
                  Metro Manila Delivery
                </h3>
                <p className="text-[#535353]">
                  Fast and reliable delivery across all Metro Manila areas
                </p>
              </div>
              <div className="text-center p-6 py-10 rounded-xl bg-[#4F7D55] hover:bg-[#436B48] shadow-[0.9px_1.8px_1.8px_-0.9px_rgba(0,0,0,0.25)] hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white text-[#436B48] rounded-full mb-4">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-medium text-[#ffff] mb-2">
                  Fresh Daily
                </h3>
                <p className="text-white/70">
                  Made fresh in our cloud kitchen with quality ingredients
                </p>
              </div>
              <div className="text-center p-6 py-10 rounded-xl bg-[#FCFFFB] shadow-[0.9px_1.8px_1.8px_-0.9px_rgba(0,0,0,0.25)] hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#436B48] text-white rounded-full mb-4">
                  <Star className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-medium text-[#333333] mb-2">
                  Authentic Recipes
                </h3>
                <p className="text-[#535353]">
                  Traditional Filipino flavors passed down through generations
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <TestimonialsSlider testimonials={testimonials} />

        {/* CTA Section */}

        <section className="relative h-auto w-full bg-cover bg-center flex items-center justify-center"
          style={{
            backgroundImage: "url('/img/bg.png')",
          }}
        >
					<div className="2xl:max-w-[28%] xl:max-w-[40%] lg:max-w-[50%] md:max-w-[65%] sm:max-w-[80%] m-10 lg:my-32 md:my-24 my-16 bg-white/70 rounded-lg">
						<div className='p-12 sm:px-20 px-10 flex flex-col justify-center items-center text-center sm:gap-5 gap-4'>
							<p className="text-xl md:text-2xl font-bold text-[#436B48]">Ready to Experience Authentic Filipino Flavors?</p>
							<p>Order now and get your favorites delivered fresh to your doorstep</p>
							<Link
								href="/menu"
								className="inline-flex items-center space-x-2 px-8 py-3 text-white bg-[#4F7D55] hover:bg-[#436B48] rounded-lg transition-colors text-sm"
							>
								<span>Browse Menu</span>
								{/* <ArrowRight className="w-6 h-6" /> */}
							</Link>
						</div>
					</div>
        </section>
        {/* <section className="py-20 bg-gradient-to-r from-amber-600 to-orange-600">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Experience Authentic Filipino Flavors?
            </h2>
            <p className="text-xl text-amber-50 mb-8">
              Order now and get your favorites delivered fresh to your doorstep
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-amber-600 rounded-lg hover:bg-[#FCFFFB] transition-colors shadow-lg font-bold text-lg"
            >
              <span>Browse Menu</span>
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </section> */}
      </main>
      <Footer />
    </div>
  );
}
