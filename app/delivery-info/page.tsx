import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Truck, Clock, CreditCard, MapPin, HelpCircle } from 'lucide-react';
import Image from 'next/image';

export default function DeliveryInfoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-4">
                Delivery & <span className="text-amber-600">Ordering</span>
              </h1>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                Everything you need to know about ordering and receiving your
                Filipino favorites
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-white">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4">
                How <span className="text-amber-600">Ordering Works</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Simple steps to get delicious Filipino food delivered to your door
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 text-white rounded-full font-bold text-2xl mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">
                  Browse Menu
                </h3>
                <p className="text-gray-600">
                  Explore our selection of authentic Filipino dishes
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 text-white rounded-full font-bold text-2xl mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">
                  Place Order
                </h3>
                <p className="text-gray-600">
                  Add items to cart and fill in delivery details
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 text-white rounded-full font-bold text-2xl mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">
                  Send Payment
                </h3>
                <p className="text-gray-600">
                  Pay via GCash or Maya and send proof of payment
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 text-white rounded-full font-bold text-2xl mb-4">
                  4
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">
                  Enjoy!
                </h3>
                <p className="text-gray-600">
                  Receive your fresh, hot Filipino favorites
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Delivery Coverage */}
        <section className="py-16 bg-gradient-to-b from-white to-amber-50">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 text-white rounded-full mb-6">
                  <MapPin className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold text-amber-900 mb-6">
                  Delivery <span className="text-amber-600">Coverage</span>
                </h2>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  We currently deliver to all areas within <strong>Metro Manila</strong>.
                  Our cloud kitchen ensures that every order is prepared fresh and
                  delivered quickly to maintain optimal quality.
                </p>
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <h3 className="font-bold text-amber-900 mb-3">
                    Estimated Delivery Time
                  </h3>
                  <p className="text-gray-700 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-amber-600" />
                    1-2 hours from order confirmation
                  </p>
                </div>
              </div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="https://cdn.abacus.ai/images/b9658fb4-dbcd-42d9-91e8-d4a7b52cd0a0.png"
                  alt="Delivery"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="py-16 bg-white">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 text-white rounded-full mb-6">
                <CreditCard className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4">
                Payment <span className="text-amber-600">Methods</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We accept secure digital payments via GCash and Maya
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 shadow-md">
                  <h3 className="text-2xl font-bold text-blue-700 mb-4">GCash</h3>
                  <p className="text-gray-700 mb-4">
                    Send payment to our GCash number and include your order number
                    in the message.
                  </p>
                  <div className="bg-white rounded-lg p-4 text-sm text-gray-700">
                    <p className="mb-2">
                      <span className="font-semibold">Account Name:</span>{' '}
                      Alexander's Cuisine
                    </p>
                    <p>
                      <span className="font-semibold">Number:</span> 09XX XXX XXXX
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 shadow-md">
                  <h3 className="text-2xl font-bold text-green-700 mb-4">Maya</h3>
                  <p className="text-gray-700 mb-4">
                    Send payment to our Maya account and include your order number
                    in the message.
                  </p>
                  <div className="bg-white rounded-lg p-4 text-sm text-gray-700">
                    <p className="mb-2">
                      <span className="font-semibold">Account Name:</span>{' '}
                      Alexander's Cuisine
                    </p>
                    <p>
                      <span className="font-semibold">Number:</span> 09XX XXX XXXX
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
                <p className="text-amber-900 text-center">
                  <span className="font-bold">Important:</span> After sending payment,
                  please email a screenshot of your payment receipt to{' '}
                  <a
                    href="mailto:sales@avasiaonline.com"
                    className="text-amber-600 hover:underline font-semibold"
                  >
                    sales@avasiaonline.com
                  </a>{' '}
                  along with your order number.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Delivery Partners */}
        <section className="py-16 bg-gradient-to-b from-white to-amber-50">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 text-white rounded-full mb-6">
                <Truck className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4">
                Delivery <span className="text-amber-600">Partners</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                Coming soon! We're partnering with trusted delivery services
              </p>
            </div>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-8 shadow-md text-center">
                <div className="bg-pink-100 w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-bold text-pink-600">FP</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">FoodPanda</h3>
                <p className="text-gray-600 mb-4">Integration coming soon</p>
                <button
                  disabled
                  className="px-6 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-md text-center">
                <div className="bg-green-100 w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-bold text-green-600">GF</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">GrabFood</h3>
                <p className="text-gray-600 mb-4">Integration coming soon</p>
                <button
                  disabled
                  className="px-6 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-white">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 text-white rounded-full mb-6">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4">
                Frequently Asked <span className="text-amber-600">Questions</span>
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-amber-50 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-amber-900 mb-2">
                  What is your minimum order amount?
                </h3>
                <p className="text-gray-700">
                  There is no minimum order amount. Order as little or as much as
                  you'd like!
                </p>
              </div>

              <div className="bg-amber-50 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-amber-900 mb-2">
                  Do you deliver outside Metro Manila?
                </h3>
                <p className="text-gray-700">
                  Currently, we only deliver within Metro Manila. We're working on
                  expanding our coverage soon!
                </p>
              </div>

              <div className="bg-amber-50 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-amber-900 mb-2">
                  Can I schedule my delivery for a specific time?
                </h3>
                <p className="text-gray-700">
                  Yes! Please mention your preferred delivery time in the order
                  notes, and we'll do our best to accommodate.
                </p>
              </div>

              <div className="bg-amber-50 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-amber-900 mb-2">
                  What if I have dietary restrictions or allergies?
                </h3>
                <p className="text-gray-700">
                  Please mention any dietary restrictions or allergies in the order
                  notes, and we'll accommodate your needs.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
