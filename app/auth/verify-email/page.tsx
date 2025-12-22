'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams?.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const res = await fetch(`/api/auth/verify-email?token=${token}`);
      const data = await res.json();

      if (res.ok) {
        if (data.alreadyVerified) {
          setStatus('success');
          setMessage('Your email was already verified. You can log in now.');
        } else {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        }
      } else {
        if (data.expired) {
          setStatus('expired');
          setMessage(data.error || 'Verification link has expired');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('An error occurred during verification');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center">
          {/* Loading State */}
          {status === 'loading' && (
            <>
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Verifying Your Email...
              </h1>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </>
          )}

          {/* Success State */}
          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Email Verified!
              </h1>
              <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3"
              >
                Go to Login
              </Button>
            </>
          )}

          {/* Expired State */}
          {status === 'expired' && (
            <>
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-orange-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Link Expired
              </h1>
              <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/auth/register')}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Request New Link
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  Go to Homepage
                </Button>
              </div>
            </>
          )}

          {/* Error State */}
          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Verification Failed
              </h1>
              <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/auth/register')}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  Go to Homepage
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
