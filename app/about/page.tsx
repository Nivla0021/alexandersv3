import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Heart, Award, Users, ChefHat } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-4">
                About <span className="text-amber-600">Alexander's</span>
              </h1>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                Bringing authentic Filipino flavors to every home in Metro Manila
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-amber-900 mb-6">
                  Our <span className="text-amber-600">Story</span>
                </h2>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    Alexander's Handcrafted Cuisine was born from a deep love for
                    traditional Filipino food and a desire to share these beloved
                    flavors with families across Metro Manila.
                  </p>
                  <p>
                    Our journey began with a simple mission: to recreate the
                    authentic taste of Filipino street food and home-cooked meals
                    that remind us of family gatherings and childhood memories.
                    Every recipe we use has been passed down through generations,
                    refined and perfected to deliver the most genuine Filipino
                    experience.
                  </p>
                  <p>
                    Operating as a cloud kitchen, we focus entirely on what
                    matters most—crafting exceptional food with premium
                    ingredients and delivering it fresh to your doorstep.
                  </p>
                </div>
              </div>
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/img/alexanders_about.webp"
                  alt="Filipino Cuisine"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-gradient-to-b from-white to-amber-50">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4">
                Our <span className="text-amber-600">Values</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                What drives us to serve the best Filipino cuisine
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 text-white rounded-full mb-4">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-3">
                  Passion
                </h3>
                <p className="text-gray-600 text-sm">
                  We pour our heart into every dish, ensuring each bite captures
                  the essence of Filipino cuisine
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 text-white rounded-full mb-4">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-3">
                  Quality
                </h3>
                <p className="text-gray-600 text-sm">
                  Only the freshest ingredients and time-tested recipes make it
                  to your table
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 text-white rounded-full mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-3">
                  Community
                </h3>
                <p className="text-gray-600 text-sm">
                  Bringing people together through the universal language of
                  delicious food
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 text-white rounded-full mb-4">
                  <ChefHat className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-3">
                  Authenticity
                </h3>
                <p className="text-gray-600 text-sm">
                  Staying true to traditional Filipino recipes while adding our
                  own creative touch
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-amber-900 mb-6">
                Our <span className="text-amber-600">Mission</span>
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                To preserve and celebrate Filipino culinary heritage by making
                authentic, high-quality Filipino food accessible to everyone in
                Metro Manila. We believe that food is more than sustenance—it's a
                connection to our roots, our culture, and our loved ones.
              </p>
              <div className="bg-amber-50 rounded-xl p-8 shadow-md">
                <p className="text-gray-800 italic text-lg">
                  "Every dish we create carries the warmth of home-cooked meals and
                  the joy of Filipino hospitality. From our kitchen to your table,
                  we deliver not just food, but cherished memories and authentic
                  flavors."
                </p>
                <p className="mt-4 font-semibold text-amber-900">- The Alexander's Team</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-amber-600 to-orange-600">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Taste the Difference?
            </h2>
            <p className="text-xl text-amber-50 mb-8">
              Experience authentic Filipino cuisine delivered fresh to your door
            </p>
            <a
              href="/menu"
              className="inline-block px-8 py-4 bg-white text-amber-600 rounded-lg hover:bg-amber-50 transition-colors shadow-lg font-bold text-lg"
            >
              Browse Our Menu
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
