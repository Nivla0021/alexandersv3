// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { User, Phone, MapPin, Mail, Lock, Tag, Clock, CheckCircle2, XCircle, Loader2, Upload, Calendar, X, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

type LocationState = {
  cityCode: string;
  cityName: string;
  barangayCode: string;
  barangayName: string;
  street: string;
};

// Discount types
type DiscountType = 'PWD' | 'SENIOR' | null;

// Discount form data
interface DiscountFormData {
  type: DiscountType;
  birthday: string;
  idImage: File | null;
  idNumber: string;
}

// Discount status types
type DiscountStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | null;

// Rejection info interface
interface RejectionInfo {
  reason: string;
  rejectedAt: string;
  attemptCount: number;
}

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

export default function ProfilePage() {
  const { data: session, status, update } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [barangays, setBarangays] = useState<any[]>([]);
  
  // Discount-related states
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>(null);
  const [discountFormData, setDiscountFormData] = useState<DiscountFormData>({
    type: null,
    birthday: '',
    idImage: null,
    idNumber: '',
  });
  const [discountStatus, setDiscountStatus] = useState<DiscountStatus>(null);
  const [idImagePreview, setIdImagePreview] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [submittingDiscount, setSubmittingDiscount] = useState(false);
  const [checkingDiscountStatus, setCheckingDiscountStatus] = useState(true);
  
  // State for rejection info and reapplication
  const [rejectionInfo, setRejectionInfo] = useState<RejectionInfo | null>(null);
  const [showReapplyConfirm, setShowReapplyConfirm] = useState(false);
  const MAX_REAPPLY_ATTEMPTS = 2;
  
  // State for banner visibility
  const [hiddenBanners, setHiddenBanners] = useState<string[]>([]);
  const [showHiddenBannersMenu, setShowHiddenBannersMenu] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
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

  /* -------------------- AUTH -------------------- */

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/profile');
    }
  }, [status, router]);

  // Load hidden banners from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('hiddenDiscountBanners');
    if (saved) {
      setHiddenBanners(JSON.parse(saved));
    }
  }, []);

  // Check discount status on page load
  useEffect(() => {
    const checkDiscountStatus = async () => {
      if (!session?.user) return;
      
      setCheckingDiscountStatus(true);
      try {
        const response = await fetch('/api/discounts/status');
        const data = await response.json();
        
        if (data.isGloballyApproved) {
          setDiscountStatus('APPROVED');
          setDiscountType(data.discountType);
        } else if (data.hasPending) {
          setDiscountStatus('PENDING');
          setDiscountType(data.discountType);
        } else if (data.hasRejected) {
          setDiscountStatus('REJECTED');
          // Store rejection info
          if (data.latestApplication) {
            setRejectionInfo({
              reason: data.latestApplication.rejectionReason || 'No specific reason provided',
              rejectedAt: data.latestApplication.rejectedAt,
              attemptCount: data.applicationCount || 1,
            });
          }
        }
      } catch (error) {
        console.error('Failed to check discount status:', error);
      } finally {
        setCheckingDiscountStatus(false);
      }
    };

    checkDiscountStatus();
  }, [session]);

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

  /* -------------------- AUTO POPULATE FROM SESSION -------------------- */

  useEffect(() => {
    if (!session?.user || cities.length === 0) return;

    const user = session.user as any;

    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });

    if (user?.address) {
      const parsed = parsePHAddress(user.address);
      if (!parsed) return;

      const city = cities.find(c =>
        c.name.toLowerCase() === parsed.city.toLowerCase()
      );
      if (!city) return;

      setLocation({
        cityCode: city.code,
        cityName: city.name,
        barangayCode: '',
        barangayName: '',
        street: parsed.street,
      });

      fetch(`https://psgc.gitlab.io/api/cities-municipalities/${city.code}/barangays`)
        .then(res => res.json())
        .then(brgys => {
          setBarangays(brgys);

          const brgy = brgys.find((b: any) =>
            b.name.toLowerCase() === parsed.barangay.toLowerCase()
          );

          if (!brgy) return;

          setLocation(prev => ({
            ...prev,
            barangayCode: brgy.code,
            barangayName: brgy.name,
          }));
        });
    }
  }, [session, cities]);

  /* -------------------- BANNER VISIBILITY FUNCTIONS -------------------- */

  const hideBanner = (bannerType: string) => {
    const updatedHidden = [...hiddenBanners, bannerType];
    setHiddenBanners(updatedHidden);
    localStorage.setItem('hiddenDiscountBanners', JSON.stringify(updatedHidden));
    toast.success(`${bannerType.charAt(0).toUpperCase() + bannerType.slice(1)} banner hidden`);
  };

  const showBanner = (bannerType: string) => {
    const updatedHidden = hiddenBanners.filter(b => b !== bannerType);
    setHiddenBanners(updatedHidden);
    localStorage.setItem('hiddenDiscountBanners', JSON.stringify(updatedHidden));
  };

  const restoreAllBanners = () => {
    setHiddenBanners([]);
    localStorage.removeItem('hiddenDiscountBanners');
    setShowHiddenBannersMenu(false);
    toast.success('All banners restored');
  };

  /* -------------------- FORM -------------------- */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDiscountClick = () => {
    setShowDiscountModal(true);
  };

  const handleDiscountTypeSelect = (type: DiscountType) => {
    setDiscountType(type);
    setDiscountFormData(prev => ({ ...prev, type }));
    setShowDiscountModal(false);
    setShowDiscountForm(true);
  };

  const handleIdImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setDiscountError('Image size should be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setDiscountError('Please upload an image file');
        return;
      }
      
      setDiscountFormData(prev => ({ ...prev, idImage: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setDiscountError('');
    }
  };

  const handleDiscountSubmit = async () => {
    // Validate form
    if (!discountFormData.birthday) {
      setDiscountError('Please enter your birthday');
      return;
    }
    
    if (!discountFormData.idNumber) {
      setDiscountError('Please enter your ID number');
      return;
    }
    
    if (!discountFormData.idImage) {
      setDiscountError('Please upload an image of your ID');
      return;
    }
    
    // Calculate age
    const birthDate = new Date(discountFormData.birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Validate age based on discount type
    if (discountType === 'SENIOR' && age < 60) {
      setDiscountError('Senior Citizen discount requires age 60 and above');
      return;
    }

    setSubmittingDiscount(true);
    setDiscountError('');

    try {
      const formData = new FormData();
      formData.append('discountType', discountType as string);
      formData.append('birthday', discountFormData.birthday);
      formData.append('idNumber', discountFormData.idNumber);
      formData.append('idImage', discountFormData.idImage);

      const response = await fetch('/api/discounts/apply', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit discount application');
      }

      setDiscountStatus('PENDING');
      setShowDiscountForm(false);
      setRejectionInfo(null); // Clear rejection info on successful reapplication
      
      // Show success message
      toast.success(data.message || 'Application submitted successfully!');
      
    } catch (err: any) {
      setDiscountError(err.message);
    } finally {
      setSubmittingDiscount(false);
    }
  };

  const handleReapply = () => {
    if (rejectionInfo && rejectionInfo.attemptCount >= MAX_REAPPLY_ATTEMPTS) {
      toast.error(`You have reached the maximum number of reapplication attempts (${MAX_REAPPLY_ATTEMPTS}). Please contact support for assistance.`);
      return;
    }
    setShowReapplyConfirm(true);
  };

  const confirmReapply = () => {
    setShowReapplyConfirm(false);
    setDiscountStatus(null); // Reset status to show apply button
    setShowDiscountModal(true); // Show discount type selection
  };

  const cancelDiscount = () => {
    setShowDiscountModal(false);
    setShowDiscountForm(false);
    setShowReapplyConfirm(false);
    setShowHiddenBannersMenu(false);
    setDiscountType(null);
    setDiscountFormData({
      type: null,
      birthday: '',
      idImage: null,
      idNumber: '',
    });
    setIdImagePreview(null);
    setDiscountError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const safeStreet = sanitizeAddressInput(location.street);

      const fullAddress = `${safeStreet}, Brgy. ${location.barangayName}, ${location.cityName}, Metro Manila`;

      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          address: fullAddress,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Profile updated successfully!');
        await update();
        setTimeout(() => router.refresh(), 500);
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || checkingDiscountStatus) {
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

  // Determine which banner to show based on status and visibility
  const showEligibleBanner = discountStatus === null && !hiddenBanners.includes('eligible');
  const showPendingBanner = discountStatus === 'PENDING' && !hiddenBanners.includes('pending');
  const showApprovedBanner = discountStatus === 'APPROVED' && !hiddenBanners.includes('approved');
  const showRejectedBanner = discountStatus === 'REJECTED' && rejectionInfo && !hiddenBanners.includes('rejected');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 py-12">
        <div className="container mx-auto max-w-3xl px-4">

          {/* Banner Visibility Controls */}
          <div className="mb-4 flex justify-between items-center">
            <div className="relative">
              <button
                onClick={() => setShowHiddenBannersMenu(!showHiddenBannersMenu)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200"
              >
                <Eye className="w-4 h-4" />
                <span>Manage Banners</span>
              </button>
              
              {showHiddenBannersMenu && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                  <div className="p-3 border-b border-gray-100">
                    <h3 className="font-medium text-gray-700">Hidden Banners</h3>
                  </div>
                  <div className="p-2">
                    {hiddenBanners.length === 0 ? (
                      <p className="text-sm text-gray-500 p-2">No hidden banners</p>
                    ) : (
                      <>
                        {hiddenBanners.map(banner => (
                          <button
                            key={banner}
                            onClick={() => showBanner(banner)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg flex items-center justify-between group"
                          >
                            <span className="text-sm text-gray-700 capitalize">{banner}</span>
                            <EyeOff className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                          </button>
                        ))}
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={restoreAllBanners}
                            className="w-full text-center text-sm text-amber-600 hover:text-amber-700 py-2"
                          >
                            Restore All Banners
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {hiddenBanners.length > 0 && (
              <p className="text-xs text-gray-500">
                {hiddenBanners.length} banner(s) hidden
              </p>
            )}
          </div>

          {/* Discount Status Banner */}
          <div className="mb-6 space-y-4">
            {/* Eligible Banner */}
            {showEligibleBanner && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                <div className="p-4 flex items-start">
                  <Tag className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-blue-800 font-medium">
                      Eligible for Discount!
                    </p>
                    <p className="text-blue-700 text-sm mt-1">
                      You may be eligible for a 20% discount. Click below to apply (one-time approval for all future orders).
                    </p>
                    <button
                      onClick={handleDiscountClick}
                      className="mt-3 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      Apply for Discount
                    </button>
                  </div>
                  <button
                    onClick={() => hideBanner('eligible')}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Hide banner"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Pending Banner */}
            {showPendingBanner && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
                <div className="p-4 flex items-start">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-yellow-800 font-medium">
                      Discount Application Pending Review
                    </p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Your {discountType === 'PWD' ? 'PWD' : 'Senior Citizen'} discount application is being reviewed. 
                      Once approved, the discount will be automatically applied to all your future orders.
                    </p>
                  </div>
                  <button
                    onClick={() => hideBanner('pending')}
                    className="text-yellow-600 hover:text-yellow-800 p-1"
                    title="Hide banner"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Approved Banner */}
            {showApprovedBanner && (
              <div className="bg-green-50 border border-green-200 rounded-lg overflow-hidden">
                <div className="p-4 flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-green-800 font-medium">
                      20% Discount Approved ({discountType === 'PWD' ? 'PWD' : 'Senior Citizen'})
                    </p>
                    <p className="text-green-700 text-sm mt-1">
                      Your discount has been approved! It will be automatically applied to all your orders.
                    </p>
                  </div>
                  <button
                    onClick={() => hideBanner('approved')}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="Hide banner"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Rejected Banner */}
            {showRejectedBanner && rejectionInfo && (
              <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-800 font-medium">
                        Discount Application Rejected
                      </p>
                      <p className="text-red-700 text-sm mt-1">
                        Attempt {rejectionInfo.attemptCount} of {MAX_REAPPLY_ATTEMPTS}
                      </p>
                    </div>
                    <button
                      onClick={() => hideBanner('rejected')}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Hide banner"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Rejection Reason */}
                  <div className="mt-3 ml-8 p-3 bg-red-100/50 rounded-lg border border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Reason for rejection:</p>
                        <p className="text-sm text-red-700 mt-1">{rejectionInfo.reason}</p>
                        {rejectionInfo.rejectedAt && (
                          <p className="text-xs text-red-600 mt-2">
                            Rejected on: {new Date(rejectionInfo.rejectedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reapply Section */}
                  <div className="mt-4 ml-8">
                    {rejectionInfo.attemptCount < MAX_REAPPLY_ATTEMPTS ? (
                      <div className="space-y-3">
                        <p className="text-sm text-red-700">
                          You can reapply with corrected information. You have {MAX_REAPPLY_ATTEMPTS - rejectionInfo.attemptCount} reapplication attempt(s) left.
                        </p>
                        <button
                          onClick={handleReapply}
                          className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reapply for Discount
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-700 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                          <span>
                            You have reached the maximum number of reapplication attempts. 
                            Please <Link href="/contact" className="text-amber-600 hover:text-amber-700 font-medium underline">contact support</Link> for assistance.
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-6">
              <h1 className="text-3xl font-bold text-white">My Profile</h1>
              <p className="text-amber-100">Manage your account information</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-2" />
                  Email
                </label>
                <Input value={(session.user as any)?.email || ''} disabled className="bg-gray-100" />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  Full Name
                </label>
                <Input name="name" value={formData.name} onChange={handleChange} required />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-2" />
                  Phone Number
                </label>
                <Input name="phone" value={formData.phone} onChange={handleChange} />
              </div>

              {/* Address */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  <MapPin className="inline w-4 h-4 mr-2" />
                  Delivery Address
                </label>

                <select
                  className="w-full border-2 border-gray-300 rounded-lg p-2"
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
                  className="w-full border-2 border-gray-300 rounded-lg p-2"
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
                  placeholder="House No / Street / Building / Unit"
                  value={location.street}
                  onChange={(e) => {
                    setLocation(prev => ({ ...prev, street: e.target.value }));
                  }}
                />

                {location.street && location.barangayName && location.cityName && (
                  <p className="text-xs text-gray-500">
                    Complete address: {location.street}, Brgy. {location.barangayName}, {location.cityName}, Metro Manila
                  </p>
                )}
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <Button type="submit" disabled={loading} className="flex-1 bg-amber-600 hover:bg-amber-700">
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>

                <Link
                  href="/profile/change-password"
                  className="flex-1 inline-flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Link>
              </div>

            </form>
          </div>
        </div>

        {/* Reapply Confirmation Modal */}
        {showReapplyConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Reapplication</h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to reapply for the discount? Please make sure you have corrected the issues from your previous application.
                </p>
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-6">
                  Note: You have {MAX_REAPPLY_ATTEMPTS - (rejectionInfo?.attemptCount || 0)} reapplication attempt(s) remaining.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={confirmReapply}
                    className="flex-1 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                  >
                    Yes, Reapply
                  </button>
                  <button
                    onClick={cancelDiscount}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Discount Type Modal */}
        {showDiscountModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Select Discount Type</h2>
                  <button
                    onClick={cancelDiscount}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Please select your eligibility for discount (one-time approval for all future orders):
                </p>
                
                <div className="space-y-4">
                  <button
                    onClick={() => handleDiscountTypeSelect('PWD')}
                    className="w-full p-4 border-2 border-amber-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-colors text-left"
                  >
                    <h3 className="font-bold text-gray-900">Persons with Disability (PWD)</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      20% discount on all purchases (requires verification)
                    </p>
                  </button>
                  
                  <button
                    onClick={() => handleDiscountTypeSelect('SENIOR')}
                    className="w-full p-4 border-2 border-amber-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-colors text-left"
                  >
                    <h3 className="font-bold text-gray-900">Senior Citizens</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      20% discount on all purchases (60 years old and above, requires verification)
                    </p>
                  </button>
                </div>
                
                <button
                  onClick={cancelDiscount}
                  className="w-full mt-6 py-3 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      
        {/* Discount Application Form Modal */}
        {showDiscountForm && discountType && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {discountType === 'PWD' ? 'PWD' : 'Senior Citizen'} Discount Application
                  </h2>
                  <button
                    onClick={cancelDiscount}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Info Banner */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>One-time Approval:</strong> Once approved, the discount will be automatically applied to all your future orders. No need to reapply.
                    </p>
                  </div>
                  
                  {/* Birthday Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline w-4 h-4 mr-2" />
                      Birthday *
                    </label>
                    <input
                      type="date"
                      value={discountFormData.birthday}
                      onChange={(e) => setDiscountFormData(prev => ({ ...prev, birthday: e.target.value }))}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used to verify age eligibility
                    </p>
                  </div>
                  
                  {/* ID Number Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Number *
                    </label>
                    <input
                      type="text"
                      value={discountFormData.idNumber}
                      onChange={(e) => setDiscountFormData(prev => ({ ...prev, idNumber: e.target.value }))}
                      placeholder={`Enter your ${discountType === 'PWD' ? 'PWD' : 'Senior Citizen'} ID number`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  {/* ID Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Upload className="inline w-4 h-4 mr-2" />
                      Upload ID Image *
                    </label>
                    
                    {!idImagePreview ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleIdImageChange}
                          className="hidden"
                          id="id-upload"
                        />
                        <label
                          htmlFor="id-upload"
                          className="cursor-pointer block"
                        >
                          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, JPEG up to 5MB
                          </p>
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <img 
                          src={idImagePreview} 
                          alt="ID Preview" 
                          className="w-full h-48 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          onClick={() => {
                            setIdImagePreview(null);
                            setDiscountFormData(prev => ({ ...prev, idImage: null }));
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Please upload a clear photo of your valid ID
                    </p>
                  </div>
                  
                  {/* Error Message */}
                  {discountError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {discountError}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    <button
                      onClick={handleDiscountSubmit}
                      disabled={submittingDiscount}
                      className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {submittingDiscount ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5 mr-2" />
                          Submitting...
                        </>
                      ) : (
                        'Submit for Review'
                      )}
                    </button>
                    
                    <button
                      onClick={cancelDiscount}
                      className="w-full py-3 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )} 
      </main>
      <Footer />
    </div>
  );
}