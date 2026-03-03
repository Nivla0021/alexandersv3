'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, CheckCircle } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

type LocationState = {
  cityCode: string;
  cityName: string;
  barangayCode: string;
  barangayName: string;
  street: string;
};

function parsePHAddress(address: string) {
  if (!address) return null;

  // Example format:
  // 123 ABC St, Brgy. Pinagbuhatan, Pasig City, Metro Manila

  const parts = address.split(',');

  if (parts.length < 4) return null;

  return {
    street: parts[0].trim(),
    barangay: parts[1].replace('Brgy.', '').trim(),
    city: parts[2].trim(),
  };
}

function sanitizeAddressInput(value: string) {
  return value
    .replace(/,/g, '')     // remove commas
    .replace(/\|/g, '')   // remove pipes
    .trim();
}

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [barangays, setBarangays] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });

  const [location, setLocation] = useState<LocationState>({
    cityCode: '',
    cityName: '',
    barangayCode: '',
    barangayName: '',
    street: '',
  });

    /* -------------------- FETCH CITIES -------------------- */
  
    useEffect(() => {
      fetch('https://psgc.gitlab.io/api/regions/130000000/cities-municipalities')
        .then(res => res.json())
        .then(data => setCities(data))
        .catch(err => console.error('City fetch error:', err));
    }, []);
  
    /* -------------------- FETCH BARANGAYS -------------------- */
  
    useEffect(() => {
      if (!location.cityCode) return;
  
      fetch(`https://psgc.gitlab.io/api/cities-municipalities/${location.cityCode}/barangays`)
        .then(res => res.json())
        .then(data => setBarangays(data))
        .catch(err => console.error('Barangay fetch error:', err));
    }, [location.cityCode]);

  const PH_MOBILE_REGEX = /^(09|\+639|639)\d{9}$/;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }

    const normalized = formData.email.trim().toLowerCase();
    // Basic format check FIRST (prevents undefined domain)
    const basicRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!basicRegex.test(normalized)) {
      newErrors.email = 'Invalid email format';
    }

    const domain = normalized.split('@')[1];

    if (!domain) {
      return 'Invalid email format';
    }

    const trustedDomains = [
      'gmail.com',
      'yahoo.com',
      'outlook.com',
      'hotmail.com',
      'icloud.com',
      'proton.me',
      'protonmail.com',
    ];

    const allowedTLDs = ['.com', '.net', '.org', '.edu', '.gov', '.mail', '.ph'];

    const bannedTLDs = ['.v', '.x', '.zzz', '.fake', '.test'];

    if (bannedTLDs.some((tld) => domain.endsWith(tld))) {
      newErrors.email = 'Invalid email domain';
    }

    const isTrustedProvider = trustedDomains.includes(domain);
    const isAllowedBusinessDomain = allowedTLDs.some((tld) =>
      domain.endsWith(tld)
    );

    if (!isTrustedProvider && !isAllowedBusinessDomain) {
      newErrors.email = 'Please use a valid email provider or company email';
    }



    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm Password is required';
    }

    // Phone validation
      const phone = formData.phone.replace(/\s+/g, '');
      if (!phone) {
        newErrors.phone = 'Phone is required';
      }else if (!PH_MOBILE_REGEX.test(phone)) {
        newErrors.phone =
          'Enter a valid PH mobile number (09XXXXXXXXX)';
      }

        // Address validation
    if (!location.cityCode) {
      newErrors.address = 'City / Municipality is required';
    } else if (!location.barangayCode) {
      newErrors.address = 'Barangay is required';
    } else if (!location.street.trim()) {
      newErrors.address = 'Street / House No. is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
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
      const capitalizeFullName = (name: string) => {
        return name
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());
      };
      const safeStreet = sanitizeAddressInput(location.street);

      const fullAddress = `${safeStreet}, Brgy. ${location.barangayName}, ${location.cityName}, Metro Manila`;
      const res = await fetch('/api/auth/customer-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: capitalizeFullName(formData.name),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone.trim() || undefined,
          address: fullAddress || undefined,
          location: {
            cityCode: location.cityCode,
            cityName: location.cityName,
            barangayCode: location.barangayCode,
            barangayName: location.barangayName,
            street: safeStreet,
          },
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setRegistered(true);
        toast.success('Registration successful! Check your email.', {
          duration: 3000,
          style: {
            background: '#D1FAE5',
            border: '1px solid #10B981',
            color: '#065F46',
            fontWeight: 600,
          }
        });
      } else {
        toast.error(data.error || 'Registration failed', {
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
      console.error('Registration error:', error);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Registration Successful!
            </h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              We've sent a verification email to <strong>{formData.email}</strong>.
              Please check your inbox and click the verification link to activate your account.
            </p>
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-900">
                <strong>Important:</strong> The verification link expires in 24 hours.
                Check your spam folder if you don't see the email.
              </p>
            </div>
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-6">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-amber-100">Join us and enjoy authentic Filipino cuisine</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Juan Dela Cruz"
                className={`pl-10 border-2 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } focus:border-amber-400`}
                disabled={loading}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="juan@example.com"
                className={`pl-10 border-2 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } focus:border-amber-400`}
                disabled={loading}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`pl-10 pr-10 border-2 ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } focus:border-amber-400`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Must be 8+ characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className={`pl-10 pr-10 border-2 ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } focus:border-amber-400`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="tel"
                name="phone"
                inputMode="numeric"
                value={formData.phone}
                onChange={handleChange}
                placeholder="09XX XXX XXXX"
                className={`pl-10 border-2 ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                } focus:border-amber-400`}
                disabled={loading}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Address */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  <MapPin className="inline w-4 h-4 mr-2" />
                  Delivery Address <span className="text-red-500">*</span>
                </label>

                <select
                  className={`w-full border-2 rounded-lg p-2 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={location.cityCode}
                  onChange={(e) => {
                    const city = cities.find(c => c.code === e.target.value);
                    setLocation({
                      cityCode: city?.code || '',
                      cityName: city?.name || '',
                      barangayCode: '',
                      barangayName: '',
                      street: '',
                    });
                    setBarangays([]);
                  }}
                >
                  <option value="">Select City / Municipality</option>
                  {cities.map(city => (
                    <option key={city.code} value={city.code}>{city.name}</option>
                  ))}
                </select>

                <select
                  className={`w-full border-2 rounded-lg p-2 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={location.barangayCode}
                  disabled={!location.cityCode}
                  onChange={(e) => {
                    const brgy = barangays.find(b => b.code === e.target.value);
                    setLocation(prev => ({
                      ...prev,
                      barangayCode: brgy?.code || '',
                      barangayName: brgy?.name || '',
                    }));
                  }}
                >
                  <option value="">Select Barangay</option>
                  {barangays.map(b => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>

                <Input
                  className={`w-full border-2 rounded-lg p-2 ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="House No / Street / Building / Unit"
                  value={location.street}
                  onChange={(e) => {
                    setLocation(prev => ({ ...prev, street: e.target.value }));
                  }}
                />
                {errors.address && (
                  <p className="text-sm text-red-600">{errors.address}</p>
                )}

                {location.street && location.barangayName && location.cityName && (
                  <p className="text-xs text-gray-500">
                    Complete address: {location.street}, Brgy. {location.barangayName}, {location.cityName}, Metro Manila
                  </p>
                )}
              </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 text-lg font-semibold"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          {/* Login Link */}
          <div className="text-center pt-4 border-t">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-amber-600 hover:text-amber-700 font-semibold"
              >
                Log in
              </Link>
            </p>
          </div>
        </form>
      </div>
      </main>
      <Footer />
    </div>
  );
}
