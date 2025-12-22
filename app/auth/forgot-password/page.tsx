'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1: Send verification code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Verification code sent to your email!', {
          duration: 3000,
          style: {
            background: '#D1FAE5',
            border: '1px solid #10B981',
            color: '#065F46',
            fontWeight: 600,
          }
        });
        setStep('verify');
      } else {
        toast.error(data.error || 'Failed to send verification code', {
          duration: 3000,
          style: {
            background: '#FEE2E2',
            border: '1px solid #EF4444',
            color: '#991B1B',
            fontWeight: 600,
          }
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('An error occurred. Please try again.', {
        duration: 3000,
        style: {
          background: '#FEE2E2',
          border: '1px solid #EF4444',
          color: '#991B1B',
          fontWeight: 600,
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify token
  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (token.length !== 6 || !/^\d+$/.test(token)) {
      toast.error('Please enter a valid 6-digit code', {
        duration: 3000,
        style: {
          background: '#FEE2E2',
          border: '1px solid #EF4444',
          color: '#991B1B',
          fontWeight: 600,
        }
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), token }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Code verified! Set your new password.', {
          duration: 3000,
          style: {
            background: '#D1FAE5',
            border: '1px solid #10B981',
            color: '#065F46',
            fontWeight: 600,
          }
        });
        setStep('reset');
      } else {
        toast.error(data.error || 'Invalid or expired code', {
          duration: 3000,
          style: {
            background: '#FEE2E2',
            border: '1px solid #EF4444',
            color: '#991B1B',
            fontWeight: 600,
          }
        });
      }
    } catch (error) {
      console.error('Token verification error:', error);
      toast.error('An error occurred. Please try again.', {
        duration: 3000,
        style: {
          background: '#FEE2E2',
          border: '1px solid #EF4444',
          color: '#991B1B',
          fontWeight: 600,
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};

    if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one number';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one special character';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the errors in the form', {
        duration: 3000,
        style: {
          background: '#FEE2E2',
          border: '1px solid #EF4444',
          color: '#991B1B',
          fontWeight: 600,
        }
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          token, 
          newPassword 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Password reset successful!', {
          duration: 3000,
          style: {
            background: '#D1FAE5',
            border: '1px solid #10B981',
            color: '#065F46',
            fontWeight: 600,
          }
        });
        setTimeout(() => router.push('/auth/login'), 2000);
      } else {
        toast.error(data.error || 'Failed to reset password', {
          duration: 3000,
          style: {
            background: '#FEE2E2',
            border: '1px solid #EF4444',
            color: '#991B1B',
            fontWeight: 600,
          }
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('An error occurred. Please try again.', {
        duration: 3000,
        style: {
          background: '#FEE2E2',
          border: '1px solid #EF4444',
          color: '#991B1B',
          fontWeight: 600,
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-6">
          <h1 className="text-3xl font-bold text-white mb-2">Forgot Password</h1>
          <p className="text-amber-100">
            {step === 'email' && 'Enter your email to receive a verification code'}
            {step === 'verify' && 'Enter the 6-digit code sent to your email'}
            {step === 'reset' && 'Set your new password'}
          </p>
        </div>

        <div className="p-8">
          {/* Step 1: Email Input */}
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="pl-10 border-2 border-gray-300 focus:border-amber-400"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 text-lg font-semibold"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>

              <div className="text-center pt-4 border-t">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center text-amber-600 hover:text-amber-700 font-semibold"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: Token Verification */}
          {step === 'verify' && (
            <form onSubmit={handleVerifyToken} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Verification Code
                </label>
                <Input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                  className="text-center text-2xl tracking-widest border-2 border-gray-300 focus:border-amber-400"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Check your email for the verification code
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 text-lg font-semibold"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setToken('');
                  }}
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
                    }}
                    placeholder="Enter new password"
                    required
                    className={`pl-10 border-2 ${
                      errors.newPassword ? 'border-red-300' : 'border-gray-300'
                    } focus:border-amber-400`}
                    disabled={loading}
                  />
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Must be 8+ characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                    }}
                    placeholder="Confirm new password"
                    required
                    className={`pl-10 border-2 ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    } focus:border-amber-400`}
                    disabled={loading}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 text-lg font-semibold"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
