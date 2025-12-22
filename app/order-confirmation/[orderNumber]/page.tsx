import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PrismaClient } from '@prisma/client';
import { CheckCircle, Clock, MapPin, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CopyOrderNumber from './CopyOrderNumber';
import { toast } from "sonner";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    orderNumber: string;
  };
}

async function getOrder(orderNumber: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
    return order;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const order = await getOrder(params.orderNumber);

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-amber-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-lg text-gray-600">
              Thank you for your order. We'll start preparing it right away.
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="text-xl font-bold text-amber-900 mb-4">
                  Order Details
                </h2>

                <div className="space-y-2 text-gray-700">
                  {/* Order Number with Copy */}
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">Order Number:</span>
                    <span>{order?.orderNumber}</span>
                    <CopyOrderNumber orderNumber={order?.orderNumber} />
                  </p>

                  {/* Status */}
                  <p>
                    <span className="font-semibold">Status:</span>{" "}
                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium capitalize">
                      {order?.orderStatus}
                    </span>
                  </p>

                  {/* Payment Method */}
                  <p>
                    <span className="font-semibold">Payment Method:</span>{" "}
                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium capitalize">
                      {order?.paymentMethod}
                    </span>
                  </p>

                  {/* Estimated Delivery */}
                  <p className="flex items-start">
                    <Clock className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                    <span>
                      <span className="font-semibold">Estimated Delivery:</span> 1-2 hours
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-amber-900 mb-4">
                  Customer Information
                </h2>
                <div className="space-y-2 text-gray-700 text-sm">
                  <p className="flex items-start">
                    <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                    <span>{order?.deliveryAddress}</span>
                  </p>
                  <p className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{order?.customerEmail}</span>
                  </p>
                  <p className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{order?.customerPhone}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-amber-900 mb-4">Order Items</h2>
              <div className="space-y-3">
                {order?.orderItems?.map((item: any) => (
                  <div
                    key={item?.id}
                    className="flex justify-between items-center py-2 border-b border-gray-100"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {item?.product?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Quantity: {item?.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-amber-900">
                      ₱{((item?.price ?? 0) * (item?.quantity ?? 0)).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-2xl font-bold text-amber-900">
                <span>Total</span>
                <span>₱{order?.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="bg-amber-50 rounded-xl shadow-md p-8 mb-8">

            <div className="mt-6 p-4 bg-amber-100 rounded-lg">
              <p className="text-sm text-amber-900">
                <span className="font-semibold">Note:</span> Please take a screenshot of this page for reference.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/menu"
              className="px-8 py-4 bg-amber-600 text-white text-center rounded-lg hover:bg-amber-700 transition-colors font-semibold"
            >
              Order More
            </Link>
            <Link
              href="/"
              className="px-8 py-4 bg-white text-amber-900 text-center rounded-lg hover:bg-amber-50 transition-colors font-semibold border-2 border-amber-600"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
