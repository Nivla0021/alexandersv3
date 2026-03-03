// app/checkout/page.tsx
'use client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useCartStore } from '@/lib/cart-store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  User, Mail, Phone, MapPin, FileText, LogIn, Package, AlertCircle, 
  X, Download, Upload, Camera, Tag, Calendar, ChevronDown, Clock, 
  CheckCircle2, XCircle, Loader2, Info, Award, ShoppingBag
} from 'lucide-react';
import Link from 'next/link';

const STORE_ZIP_CODE = '1602';

// Metro Manila delivery zones with base fees
const DELIVERY_ZONES = [
  { zipCodes: ['1602'], fee: 50, name: 'Same Area (Pinagbuhatan)' },
  { zipCodes: ['1600', '1601', '1603', '1604', '1605', '1606', '1607', '1608', '1609', '1610', '1611'], fee: 80, name: 'Pasig City' },
  { zipCodes: ['1550', '1551', '1500', '1200', '1620'], fee: 100, name: 'Adjacent Cities' },
  { zipCodes: ['1000', '1001', '1002', '1003', '1004', '1005', '1100', '1101', '1102', '1103', '1300', '1301', '1302'], fee: 120, name: 'Central Metro Manila' },
  { zipCodes: ['1630', '1631', '1632', '1700', '1740', '1770'], fee: 150, name: 'Southern Metro Manila' },
  { zipCodes: ['1400', '1440', '1470', '1485'], fee: 180, name: 'Northern Metro Manila' },
  { zipCodes: ['1900', '1870', '1920', '1930', '1940'], fee: 220, name: 'Rizal Province' },
];

// Common city name variations mapped to base zip codes
const CITY_TO_BASE_ZIP: Record<string, string> = {
  // City variations (lowercase for case-insensitive matching)
  'pasig': '1600', 'pasig city': '1600',
  'pasay': '1300', 'pasay city': '1300',
  'makati': '1200', 'makati city': '1200',
  'manila': '1000', 'manila city': '1000',
  'quezon city': '1100', 'quezon': '1100',
  'taguig': '1630', 'taguig city': '1630', 'bgc': '1634', 'fort bonifacio': '1634',
  'mandaluyong': '1550', 'mandaluyong city': '1550',
  'san juan': '1500', 'san juan city': '1500',
  'marikina': '1800', 'marikina city': '1800',
  'parañaque': '1700', 'parañaque city': '1700', 'paranaque': '1700',
  'las piñas': '1740', 'las piñas city': '1740',
  'muntinlupa': '1770', 'muntinlupa city': '1770',
  'valenzuela': '1440', 'valenzuela city': '1440',
  'malabon': '1470', 'malabon city': '1470',
  'navotas': '1485', 'navotas city': '1485',
  'caloocan': '1400', 'caloocan city': '1400',
  'pateros': '1620', 'pateros, metro manila': '1620',
  
  // Rizal
  'cainta': '1900', 'cainta, rizal': '1900',
  'antipolo': '1870', 'antipolo city': '1870',
  'taytay': '1920', 'taytay, rizal': '1920',
  'angono': '1930', 'angono, rizal': '1930',
  'binangonan': '1940', 'binangonan, rizal': '1940',
};

// Barangay to zip code mapping (common ones only)
const BARANGAY_ZIP: Record<string, string> = {
  // Pasig
  'pinagbuhatan': '1602', 'kapitolyo': '1603', 'rosario': '1604', 'san miguel': '1605',
  'santolan': '1610', 'caniogan': '1606', 'manggahan': '1611', 'bagong ilog': '1600',
  
  // Pasay
  'villamor': '1301', 'domestic airport': '1301', 'picc': '1307', 'baclaran': '1302',
  'san isidro': '1303', 'san rafael': '1304', 'san roque': '1305', 'santa clara': '1306',
  
  // Makati
  'poblacion': '1210', 'bel-air': '1209', 'san lorenzo': '1223', 'urdaneta': '1225',
  'forbes park': '1219',
  
  // Manila
  'intramuros': '1002', 'malate': '1004', 'ermita': '1000', 'binondo': '1006',
  'quiapo': '1001', 'sampaloc': '1008', 'santa cruz': '1014', 'tondo': '1013',
  
  // QC
  'cubao': '1109', 'kamuning': '1103', 'project 4': '1109', 'project 6': '1100',
  'project 7': '1105', 'project 8': '1106', 'diliman': '1101', 'commonwealth': '1121',
  
  // Taguig
  'fort bonifacio': '1634', 'bgc': '1634', 'bicutan': '1631', 'western bicutan': '1630',
  'ususan': '1639',
  
  // Mandaluyong
  'wack-wack': '1552', 'barangka': '1554', 'plainview': '1550', 'addition hills': '1550',
  
  // San Juan
  'greenhills': '1502', 'ermitaño': '1500', 'santa lucia': '1501',
  
  // Paranaque
  'bf homes': '1720', 'don bosco': '1711', 'marcelo green': '1700', 'san dionisio': '1700',
  'san isidro p': '1700', 'sun valley': '1703', 'tambo': '1701',
};

// Discount types
type DiscountType = 'PWD' | 'SENIOR' | null;

// Discount status types
type DiscountStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | null;

// Item with discount info
interface DiscountedItemInfo {
  id: string;
  name: string;
  originalPrice: number;
  quantity: number;
  discountAmount: number;
  discountedPrice: number;
  variantId?: string;
  variantLabel?: string;
}

// Enhanced interfaces for detailed data
interface OrderItemData {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variantId?: string;
  variantLabel?: string;
  discountApplied: boolean;
  discountAmount: number;
  discountedPrice: number;
  isHighestPriced: boolean;
  originalTotal: number;
  finalTotal: number;
  category?: string;
}

interface DiscountDetails {
  type: DiscountType;
  totalDiscount: number;
  calculationMethod: 'highest_priced_item';
  appliedToItem: DiscountedItemInfo;
  itemsConsidered: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    variantLabel?: string;
  }>;
  discountApprovalId?: string;
}

// Helper function to get zip code from address
function getZipCodeFromAddress(address: string): string | null {
  if (!address) return null;
  
  // First, try to extract explicit zip code from address
  const zipCodeMatch = address.match(/\b(\d{4})\b/);
  if (zipCodeMatch) {
    return zipCodeMatch[1];
  }
  
  const addressLower = address.toLowerCase();
  
  // Try to extract barangay (common patterns)
  const brgyMatch = addressLower.match(/(?:brgy\.?\s*|barangay\s*)([a-z\s]+?)(?:,|\s+\d|$)/i);
  if (brgyMatch) {
    const barangay = brgyMatch[1].trim();
    for (const [key, zip] of Object.entries(BARANGAY_ZIP)) {
      if (barangay.includes(key) || key.includes(barangay)) {
        return zip;
      }
    }
  }
  
  // Check city
  for (const [key, zip] of Object.entries(CITY_TO_BASE_ZIP)) {
    if (addressLower.includes(key)) {
      return zip;
    }
  }
  
  return null;
}

// Helper function to calculate delivery fee based on zip code
function calculateDeliveryFee(zipCode: string | null): number {
  if (!zipCode) return 250; // Default fee
  
  const zone = DELIVERY_ZONES.find(z => z.zipCodes.includes(zipCode));
  return zone?.fee || 250;
}

// Helper function to get delivery zone name
function getDeliveryZone(zipCode: string | null): string {
  if (!zipCode) return 'Unknown Location';
  
  const zone = DELIVERY_ZONES.find(z => z.zipCodes.includes(zipCode));
  return zone?.name || 'Other Areas';
}

// Helper function to extract city from address
function extractCityFromAddress(address: string): string | null {
  if (!address) return null;
  
  const parts = address.split(',').map(p => p.trim());
  
  // Look for city in address parts
  for (const part of parts) {
    if (part.toLowerCase().includes('city') || 
        part.toLowerCase().includes('manila') ||
        part.toLowerCase().includes('pasig') ||
        part.toLowerCase().includes('makati')) {
      return part;
    }
  }
  
  // Return the second-to-last part as fallback
  return parts.length >= 2 ? parts[parts.length - 2] : null;
}

// Helper function to extract barangay from address
function extractBarangayFromAddress(address: string): string | null {
  if (!address) return null;
  
  const parts = address.split(',').map(p => p.trim());
  
  for (const part of parts) {
    if (part.toLowerCase().includes('brgy') || part.toLowerCase().includes('barangay')) {
      return part.replace(/^brgy\.?\s*/i, '').replace(/^barangay\s*/i, '').trim();
    }
  }
  
  return parts.length >= 2 ? parts[1] : null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [mounted, setMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const items = useCartStore((state) => state.items ?? []);
  const clearCart = useCartStore((state) => state.clearCart);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    orderNotes: '',
    paymentMethod: 'COD',
  });
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [zipCodeError, setZipCodeError] = useState('');
  const [estimatedZipCode, setEstimatedZipCode] = useState<string | null>(null);
  const [userLocationData, setUserLocationData] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // GCash QR flow states
  const [showGcashQR, setShowGcashQR] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [gcashReference, setGcashReference] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Discount-related states
  const [discountStatus, setDiscountStatus] = useState<DiscountStatus>(null);
  const [discountType, setDiscountType] = useState<DiscountType>(null);
  const [checkingDiscountStatus, setCheckingDiscountStatus] = useState(true);
  const [discountApprovalId, setDiscountApprovalId] = useState<string | undefined>();
  
  // New states for item-specific discount
  const [discountedItem, setDiscountedItem] = useState<DiscountedItemInfo | null>(null);
  const [itemsConsidered, setItemsConsidered] = useState<Array<{id: string; name: string; price: number; quantity: number; variantLabel?: string}>>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check authentication and prefill form
  useEffect(() => {
    if (status === 'loading') {
      setCheckingAuth(true);
      return;
    }
    setCheckingAuth(false);
    
    if (status === 'unauthenticated' || !session) {
      return;
    }
    
    if (session.user) {
      const userData = session.user as any;
      setFormData((prev) => ({
        ...prev,
        customerName: userData.name || '',
        customerEmail: userData.email || '',
        customerPhone: userData.phone || '',
        deliveryAddress: userData.address || '',
      }));
      
      if (userData.location) {
        setUserLocationData(userData.location);
      }
    }
  }, [session, status]);

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
          // Store the discount approval ID if available
          if (data.approvalId) {
            setDiscountApprovalId(data.approvalId);
          }
        } else if (data.hasPending) {
          setDiscountStatus('PENDING');
          setDiscountType(data.discountType);
        } else if (data.hasRejected) {
          setDiscountStatus('REJECTED');
        }
      } catch (error) {
        console.error('Failed to check discount status:', error);
      } finally {
        setCheckingDiscountStatus(false);
      }
    };

    checkDiscountStatus();
  }, [session]);

  // Calculate delivery fee when address changes
  useEffect(() => {
    if (formData.deliveryAddress) {
      const zipCode = getZipCodeFromAddress(formData.deliveryAddress);
      setEstimatedZipCode(zipCode);
      const fee = calculateDeliveryFee(zipCode);
      setDeliveryFee(fee);
      
      if (!zipCode) {
        const city = extractCityFromAddress(formData.deliveryAddress);
        if (city) {
          setZipCodeError(`Unable to determine zip code for "${city}". Please ensure your address is complete.`);
        } else {
          setZipCodeError('Unable to determine delivery location. Please ensure your address is complete and includes the city name.');
        }
      } else {
        setZipCodeError('');
      }
    } else {
      setDeliveryFee(0);
      setEstimatedZipCode(null);
      setZipCodeError('');
    }
  }, [formData.deliveryAddress]);

  // Calculate which item gets the discount (highest priced item)
  useEffect(() => {
    if (discountStatus === 'APPROVED' && items.length > 0) {
      // Find the highest priced item
      const highestPriceItem = items.reduce((max, item) => 
        item.price > max.price ? item : max
      , items[0]);
      
      const discountAmount = highestPriceItem.price * 0.2;
      const discountedPrice = highestPriceItem.price - discountAmount;
      
      setDiscountedItem({
        id: highestPriceItem.id,
        name: highestPriceItem.name,
        originalPrice: highestPriceItem.price,
        quantity: 1, // Discount applies to only one quantity
        discountAmount: discountAmount,
        discountedPrice: discountedPrice,
        variantId: highestPriceItem.variantId,
        variantLabel: highestPriceItem.variantLabel,
      });
      
      // Store all items considered for the discount calculation
      setItemsConsidered(items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        variantLabel: item.variantLabel,
      })));
    } else {
      setDiscountedItem(null);
      setItemsConsidered([]);
    }
  }, [discountStatus, items]);

  // Calculate totals
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTotalDiscount = () => {
    if (!discountedItem) return 0;
    return discountedItem.discountAmount;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateTotalDiscount();
    return subtotal + deliveryFee - discount;
  };

  const subtotal = calculateSubtotal();
  const totalDiscount = calculateTotalDiscount();
  const total = calculateTotal();

  // Prepare enhanced order items data
  const prepareOrderItemsData = (): OrderItemData[] => {
    return items.map(item => {
      const isDiscounted = discountedItem?.id === item.id;
      const itemTotal = item.price * item.quantity;
      const discountAmount = isDiscounted ? discountedItem!.discountAmount : 0;
      const discountedPrice = isDiscounted ? (item.price * item.quantity) - discountAmount : itemTotal;
      
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        variantId: item.variantId,
        variantLabel: item.variantLabel,
        discountApplied: isDiscounted,
        discountAmount: discountAmount,
        discountedPrice: discountedPrice,
        isHighestPriced: isDiscounted,
        originalTotal: itemTotal,
        finalTotal: discountedPrice,
        category: item.category,
      };
    });
  };

  // Prepare discount details for the order
  const prepareDiscountDetails = (): DiscountDetails | null => {
    if (!discountedItem || discountStatus !== 'APPROVED') return null;
    
    return {
      type: discountType,
      totalDiscount: totalDiscount,
      calculationMethod: 'highest_priced_item',
      appliedToItem: discountedItem,
      itemsConsidered: itemsConsidered,
      discountApprovalId: discountApprovalId,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setZipCodeError('');
    
    const zipCode = getZipCodeFromAddress(formData.deliveryAddress);
    if (!zipCode) {
      setZipCodeError('Unable to determine delivery location. Please ensure your address is complete.');
      return;
    }
    
    setLoading(true);
    
    if (!items.length) {
      setError('Your cart is empty.');
      setLoading(false);
      return;
    }

    try {
      // Prepare comprehensive order data matching backend expectations
      const orderData = {
        // Customer Information
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        deliveryAddress: formData.deliveryAddress,
        orderNotes: formData.orderNotes,
        paymentMethod: formData.paymentMethod === 'GCASH' ? 'GCASH' : 'COD',
        userId: (session?.user as any)?.id,
        
        // Order Mode (required for kiosk but we'll set null for online)
        orderMode: null,
        orderSource: 'ONLINE',

        // Order Summary
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        total: total,

        // Delivery Information
        deliveryZipCode: zipCode,
        userLocationData: userLocationData,

        // Items with detailed information - THIS MUST MATCH BACKEND EXPECTATIONS
        items: prepareOrderItemsData(),

        // Discount fields - USING CORRECT NAMES
        discountApplied: discountStatus === 'APPROVED',
        discountType: discountType,
        discountAmount: totalDiscount,
        discountApprovalId: discountApprovalId,
        discountDetails: prepareDiscountDetails(),

        // Raw items for backward compatibility
        rawItems: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variantId: item.variantId,
          variantLabel: item.variantLabel,
          category: item.category,
        })),
      };

      console.log('Sending order data:', JSON.stringify(orderData, null, 2)); // Debug log

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create order');
      }

      if (formData.paymentMethod === 'COD') {
        clearCart();
        router.push(`/order-confirmation/${data.order.orderNumber}`);
        return;
      }

      if (formData.paymentMethod === 'GCASH') {
        setCurrentOrder({
          ...data.order,
          total,
          discountedItem,
          totalDiscount,
        });
        setShowGcashQR(true);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('Order submission error:', err);
      setError(err?.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const handleGcashVerification = async () => {
    if (!gcashReference.trim()) {
      setError('Please enter the GCash reference number');
      return;
    }
    
    setVerificationLoading(true);
    
    try {
      const response = await fetch('/api/orders/gcash-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: currentOrder.id,
          orderNumber: currentOrder.orderNumber,
          gcashReference: gcashReference.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to submit payment verification');
      }
      
      clearCart();
      setShowGcashQR(false);
      alert('Thank you! Your payment verification has been submitted. We will process your order once payment is confirmed.');
      router.push(`/order-confirmation/${currentOrder.orderNumber}`);
      
    } catch (err: any) {
      setError(err?.message || 'Failed to submit payment verification');
      setVerificationLoading(false);
    }
  };

  const handleDiscountClick = () => {
    router.push('/profile');
  };

  const cancelGcashPayment = () => {
    setShowGcashQR(false);
    setCurrentOrder(null);
    setGcashReference('');
  };

  const getAddressSummary = () => {
    if (!formData.deliveryAddress) return null;
    
    const city = extractCityFromAddress(formData.deliveryAddress);
    const barangay = extractBarangayFromAddress(formData.deliveryAddress);
    
    return {
      city,
      barangay,
      hasZipCode: estimatedZipCode !== null,
    };
  };

  const addressSummary = getAddressSummary();

  // Loading state
  if (!mounted || checkingAuth || checkingDiscountStatus) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-b from-amber-50 to-white">
          <div className="container mx-auto max-w-4xl px-4 py-12 text-center">
            <Loader2 className="animate-spin h-12 w-12 text-amber-600 mx-auto" />
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Authentication check
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-b from-amber-50 to-white">
          <div className="container mx-auto max-w-2xl px-4 py-12">
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogIn className="w-12 h-12 text-amber-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Login Required
              </h1>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Please log in to your account to proceed with checkout.
              </p>
              <div className="space-y-3">
                <Link
                  href={`/auth/login?callbackUrl=/checkout`}
                  className="block w-full py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Log In to Continue
                </Link>
                <Link
                  href="/auth/register"
                  className="block w-full py-3 px-6 bg-white border-2 border-amber-300 text-amber-700 font-semibold rounded-lg hover:bg-amber-50 transition-colors"
                >
                  Create New Account
                </Link>
                <Link
                  href="/cart"
                  className="block text-amber-600 hover:text-amber-700 text-sm font-medium mt-4"
                >
                  ← Back to Cart
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // GCash QR code view
  if (showGcashQR && currentOrder) {
    const gcashNumber = process.env.NEXT_PUBLIC_GCASH_NUMBER || "09171234567";
    const gcashName = process.env.NEXT_PUBLIC_GCASH_NAME || "Alexander's Crusine";

    const downloadQRCode = () => {
      const link = document.createElement('a');
      link.href = '/img/gcashQr.jpg';
      link.download = `GCash-QR-Order-${currentOrder.orderNumber}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-b from-amber-50 to-white">
          <div className="container mx-auto max-w-4xl px-4 py-12">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Pay Order #{currentOrder.orderNumber}
              </h1>
              <button
                onClick={cancelGcashPayment}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8 max-w-md mx-auto">
              <div className="text-center mb-8">
                <p className="text-gray-600 mb-2">Total Amount</p>
                <p className="text-4xl font-bold text-green-700">₱{total.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-1">Order #{currentOrder.orderNumber}</p>
                {discountStatus === 'APPROVED' && discountedItem && (
                  <div className="mt-2 bg-green-100 text-green-800 text-sm py-1 px-3 rounded-full inline-block">
                    20% Discount Applied to {discountedItem.name}
                  </div>
                )}
              </div>
              
              <div className="relative mb-6">
                <div className="border-2 border-green-300 rounded-xl p-4 bg-green-50">
                  <img 
                    src="/img/gcashQr.jpg" 
                    alt="GCash QR Code" 
                    className="w-64 h-64 mx-auto object-contain"
                  />
                  <div className="text-center mt-4">
                    <div className="inline-block bg-black/90 text-white px-4 py-2 rounded-lg">
                      <span className="text-sm">Amount: </span>
                      <span className="font-bold">₱{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mb-8">
                <button
                  onClick={downloadQRCode}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download QR Code
                </button>
                
                <button
                  onClick={() => setShowInstructions(true)}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  How to Pay ↗
                </button>
              </div>
              
              <div className="border-t pt-6 text-center">
                <p className="text-sm text-gray-600 mb-2">Or send to GCash number:</p>
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="font-mono text-lg font-bold">{gcashNumber}</p>
                  <p className="text-sm text-gray-500">{gcashName}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(gcashNumber)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Copy Number
                </button>
              </div>
              
              <div className="mt-8 pt-6 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number *
                </label>
                <input
                  type="text"
                  value={gcashReference}
                  onChange={(e) => setGcashReference(e.target.value)}
                  placeholder="Enter GCash reference no. from your payment receipt"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={verificationLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Find this in GCash after payment
                </p>
                
                {error && (
                  <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={handleGcashVerification}
                    disabled={verificationLoading || !gcashReference.trim()}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {verificationLoading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 mr-2 inline-block" />
                        Verifying...
                      </>
                    ) : (
                      'Submit Payment'
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={cancelGcashPayment}
                    className="w-full py-3 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              <div className="inline-flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                Waiting for payment verification
              </div>
            </div>
          </div>
        </main>
        <Footer />
        
        {/* Instructions Modal */}
        {showInstructions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">How to Pay with GCash</h2>
                  <button
                    onClick={() => setShowInstructions(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Camera className="w-5 h-5 mr-2 text-green-600" />
                      Scan Directly
                    </h3>
                    <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                      <li>Open GCash app and tap "Scan QR"</li>
                      <li>Point camera at the QR code above</li>
                      <li><strong>Enter amount: ₱{total.toFixed(2)}</strong></li>
                      <li>Add note: Order #{currentOrder.orderNumber}</li>
                      <li>Complete payment with your MPIN</li>
                    </ol>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Download className="w-5 h-5 mr-2 text-blue-600" />
                      Download & Upload
                    </h3>
                    <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                      <li>Click "Download QR Code" above</li>
                      <li>Save image to your phone</li>
                      <li>Open GCash → "Scan QR"</li>
                      <li>Tap gallery icon in scanner</li>
                      <li>Select downloaded QR image</li>
                      <li><strong>Enter amount: ₱{total.toFixed(2)}</strong></li>
                      <li>Complete payment</li>
                    </ol>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowInstructions(false)}
                  className="w-full mt-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                >
                  Got it, close instructions
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Regular checkout form
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <h1 className="text-4xl font-bold text-amber-900 mb-8">
            <span className="text-amber-600">Checkout</span>
          </h1>
          
          {/* Delivery Fee Info Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Package className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Delivery fees are calculated based on your location
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  Our store is located in Pinagbuhatan, Pasig (1602).
                </p>
                {estimatedZipCode && addressSummary && (
                  <div className="mt-2 text-xs bg-amber-100 p-2 rounded">
                    <span className="font-medium">Detected Location:</span> 
                    {addressSummary.barangay && ` ${addressSummary.barangay},`}
                    {addressSummary.city && ` ${addressSummary.city}`}
                    <span className="font-semibold ml-2">(ZIP: {estimatedZipCode})</span>
                    <span className="block mt-1 text-amber-700">
                      Delivery Zone: {getDeliveryZone(estimatedZipCode)} (₱{deliveryFee})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Discount Status Banner */}
          <div className="mb-6">
            {discountStatus === null && (
              <button
                onClick={handleDiscountClick}
                className="flex items-center text-amber-600 hover:text-amber-700 font-medium transition-colors group"
              >
                <Tag className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                <span>Eligible for DISCOUNT? Go to Profile to apply</span>
                <ChevronDown className="w-4 h-4 ml-1 group-hover:translate-y-0.5 transition-transform" />
              </button>
            )}

            {discountStatus === 'PENDING' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-yellow-800 font-medium">
                    Discount Application Pending Review
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Your {discountType === 'PWD' ? 'PWD' : 'Senior Citizen'} discount application is being reviewed.
                  </p>
                </div>
              </div>
            )}

            {discountStatus === 'APPROVED' && discountedItem && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-green-800 font-medium">
                      20% Discount Approved ({discountType === 'PWD' ? 'PWD' : 'Senior Citizen'})
                    </p>
                    <p className="text-green-700 text-sm mt-1">
                      Discount applied to highest-priced item: <strong>{discountedItem.name}</strong>
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      Original: ₱{discountedItem.originalPrice.toFixed(2)} → Discounted: ₱{discountedItem.discountedPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {discountStatus === 'REJECTED' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-800 font-medium">
                    Discount Application Rejected
                  </p>
                  <p className="text-red-700 text-sm mt-1">
                    Your discount application could not be approved. Please check your profile for more information.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-2">
                    <User className="inline w-4 h-4 mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    readOnly={true}
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="Juan Dela Cruz"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can update your name in your profile settings.
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-2">
                    <Mail className="inline w-4 h-4 mr-2" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    readOnly={true}
                    required
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="juan@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-2">
                    <Phone className="inline w-4 h-4 mr-2" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    readOnly={true}
                    required
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="09XX XXX XXXX"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can update your phone number in your profile settings.
                  </p>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-2">
                    <MapPin className="inline w-4 h-4 mr-2" />
                    Delivery Address *
                  </label>
                  <textarea
                    required
                    readOnly={true}
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                  <div className="mt-2">
                    {zipCodeError ? (
                      <div className="flex items-center text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {zipCodeError}
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500">
                          Your address is saved from your profile. If incorrect, please update it in your profile settings.
                        </p>
                        {addressSummary && (
                          <div className="mt-2 space-y-1">
                            {estimatedZipCode && (
                              <div className="text-sm">
                                <span className="text-amber-700 font-medium">
                                  Delivery Zone: {getDeliveryZone(estimatedZipCode)}
                                </span>
                              </div>
                            )}
                            {userLocationData && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">Location Data:</span> 
                                {userLocationData.cityName && ` ${userLocationData.cityName},`}
                                {userLocationData.barangayName && ` ${userLocationData.barangayName}`}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Address Update Note */}
                {zipCodeError && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                    <p className="font-medium mb-1">Need to update your address?</p>
                    <p>Please go to your profile settings to update your delivery address.</p>
                    <Link 
                      href="/profile" 
                      className="inline-block mt-2 text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Go to Profile Settings →
                    </Link>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-2">
                    <FileText className="inline w-4 h-4 mr-2" />
                    Order Notes (Optional)
                  </label>
                  <textarea
                    value={formData.orderNotes}
                    onChange={(e) => setFormData({ ...formData, orderNotes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none"
                    placeholder="Notes you want to add for your order (e.g., delivery instructions or food preferences)."
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-2">
                    Payment Method *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={formData.paymentMethod === 'COD'}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      />
                      <span>Cash on Delivery (COD)</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="GCASH"
                        checked={formData.paymentMethod === 'GCASH'}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      />
                      <span>GCash (QR Code Payment)</span>
                    </label>
                  </div>
                  
                  {formData.paymentMethod === 'GCASH' && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800">
                        <strong>Note:</strong> After placing your order, you'll see a QR code to scan with your GCash app. 
                        Payment verification is manual and may take 15-30 minutes during business hours.
                      </p>
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !!zipCodeError}
                  className="w-full py-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Processing...
                    </span>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-20">
                <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Order Summary
                </h2>
                
                {/* Items List with Detailed Breakdown */}
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {items.map((item) => {
                    const isDiscounted = discountedItem?.id === item.id;
                    const itemTotal = item.price * item.quantity;
                    
                    return (
                      <div
                        key={item.id + (item.variantId || '')}
                        className={`p-3 rounded-lg ${
                          isDiscounted ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {item.name}
                            </p>
                            {item.variantLabel && (
                              <p className="text-xs text-gray-500">
                                {item.variantLabel}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Qty: {item.quantity} × ₱{item.price.toFixed(2)}
                            </p>
                            
                            {/* Detailed price breakdown */}
                            <div className="mt-2 space-y-1 text-sm">
                              {isDiscounted && discountedItem ? (
                                <>
                                  <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>₱{itemTotal.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-green-600">
                                    <span className="flex items-center">
                                      <Award className="w-3 h-3 mr-1" />
                                      20% Discount (1 item)
                                    </span>
                                    <span>-₱{discountedItem.discountAmount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between font-medium pt-1 border-t border-green-200">
                                    <span>Item Total</span>
                                    <span>₱{(itemTotal - discountedItem.discountAmount).toFixed(2)}</span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex justify-between font-medium">
                                  <span>Item Total</span>
                                  <span>₱{itemTotal.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {isDiscounted && (
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded ml-2">
                              20% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Grand Total Breakdown */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₱{subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="text-gray-600">Delivery Fee</span>
                      {estimatedZipCode && (
                        <p className="text-xs text-gray-500">
                          {getDeliveryZone(estimatedZipCode)}
                        </p>
                      )}
                    </div>
                    <span className="font-medium">₱{deliveryFee.toFixed(2)}</span>
                  </div>

                  {/* Discount Breakdown */}
                  {discountStatus === 'APPROVED' && discountedItem && (
                    <div className="bg-green-50 p-3 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm text-green-700">
                        <span className="font-medium">Discount Applied</span>
                        <span>-₱{totalDiscount.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-green-600">
                        <span className="block">20% off on: {discountedItem.name}</span>
                        <span className="block mt-1">
                          Original: ₱{discountedItem.originalPrice.toFixed(2)} → 
                          Discounted: ₱{discountedItem.discountedPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Pending Discount Note */}
                  {discountStatus === 'PENDING' && (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-700 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>Discount pending approval</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Grand Total */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className={discountStatus === 'APPROVED' ? 'text-green-600' : 'text-gray-900'}>
                        ₱{total.toFixed(2)}
                      </span>
                    </div>
                    {discountStatus === 'APPROVED' && totalDiscount > 0 && (
                      <p className="text-xs text-green-600 text-right mt-1">
                        You saved ₱{totalDiscount.toFixed(2)}!
                      </p>
                    )}
                  </div>
                </div>

                {/* Delivery Info Note */}
                {deliveryFee > 0 && (
                  <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium mb-1">Delivery Fee Information:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {DELIVERY_ZONES.map(zone => (
                        <li key={zone.name}>{zone.name}: ₱{zone.fee}</li>
                      ))}
                      <li>Other Areas: ₱250</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div> 
        </div>
      </main>
      <Footer />
    </div>
  );
}