'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import {
  CalendarCheck,
  Clock,
  Users,
  ArrowLeft,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Reservation {
  id: string;
  reservationDate: string;
  reservationTime: string;
  guests: number;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export default function ReservationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/reservations');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchReservations();
    }
  }, [session]);

  const fetchReservations = async () => {
    try {
      const res = await fetch('/api/reservations'); // frontend-only for now
      if (res.ok) {
        const data = await res.json();
        setReservations(data);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReservation = async () => {
    if (!date || !time) return;

    // frontend-only mock submit
    const newReservation: Reservation = {
      id: crypto.randomUUID(),
      reservationDate: date,
      reservationTime: time,
      guests,
      notes,
      status: 'pending',
    };

    setReservations((prev) => [newReservation, ...prev]);

    // reset form
    setDate('');
    setTime('');
    setGuests(1);
    setNotes('');
  };

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 py-12">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center text-amber-700 hover:text-amber-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-6">
              <h1 className="text-3xl font-bold text-white mb-2">
                My Reservations
              </h1>
              <p className="text-amber-100">
                Book a table and manage your reservations
              </p>
            </div>

            <div className="p-8 space-y-10">
              {/* Create Reservation */}
              <div className="border border-amber-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-amber-600" />
                  New Reservation
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guests
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Special requests"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={handleCreateReservation}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <CalendarCheck className="w-4 h-4 mr-2" />
                    Reserve
                  </Button>
                </div>
              </div>

              {/* Reservations List */}
              {reservations.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No reservations yet
                  </h3>
                  <p className="text-gray-600">
                    Make your first reservation above
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.map((res) => (
                    <div
                      key={res.id}
                      className="border border-amber-200 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">
                          {res.reservationDate}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {res.reservationTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {res.guests} guests
                          </span>
                        </div>
                        {res.notes && (
                          <p className="text-sm text-gray-500 mt-2">
                            Note: {res.notes}
                          </p>
                        )}
                      </div>

                      <span
                        className={`px-4 py-2 rounded-full text-xs font-semibold border ${getStatusColor(
                          res.status
                        )}`}
                      >
                        {res.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
