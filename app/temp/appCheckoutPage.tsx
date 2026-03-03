'use client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useCartStore } from '@/lib/cart-store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Mail, Phone, MapPin, FileText, LogIn, Package, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Store location zip code
const STORE_ZIP_CODE = '1602';

// Comprehensive City to Zip Code mapping for Metro Manila
const CITY_ZIP_MAPPING = {
  // Pasig City
  'Pasig': '1600',
  'Pasig City': '1600',
  'Pinagbuhatan': '1602',
  'Kapitolyo': '1603',
  'Rosario': '1604',
  'San Miguel': '1605',
  'Santolan': '1610',
  'Bagong Ilog': '1600',
  'Caniogan': '1606',
  'Manggahan': '1611',
  
  // Pasay City
  'Pasay': '1300',
  'Pasay City': '1300',
  'Villamor': '1301',
  'Domestic Airport': '1301',
  'PICC': '1307',
  'Baclaran': '1302',
  'San Isidro': '1303',
  'San Rafael': '1304',
  'San Roque': '1305',
  'Santa Clara': '1306',
  
  // Makati
  'Makati': '1200',
  'Makati City': '1200',
  'Poblacion': '1210',
  'Bel-Air': '1209',
  'San Lorenzo': '1223',
  'Urdaneta': '1225',
  'Forbes Park': '1219',
  
  // Manila
  'Manila': '1000',
  'Manila City': '1000',
  'Intramuros': '1002',
  'Malate': '1004',
  'Ermita': '1000',
  'Binondo': '1006',
  'Quiapo': '1001',
  'Sampaloc': '1008',
  'Santa Cruz': '1014',
  'Tondo': '1013',
  
  // Quezon City
  'Quezon City': '1100',
  'Quezon': '1100',
  'Cubao': '1109',
  'Kamuning': '1103',
  'Project 4': '1109',
  'Project 6': '1100',
  'Project 7': '1105',
  'Project 8': '1106',
  'Diliman': '1101',
  'Commonwealth': '1121',
  
  // Taguig
  'Taguig': '1630',
  'Taguig City': '1630',
  'Fort Bonifacio': '1634',
  'BGC': '1634',
  'Bicutan': '1631',
  'Western Bicutan': '1630',
  'Ususan': '1639',
  
  // Mandaluyong
  'Mandaluyong': '1550',
  'Mandaluyong City': '1550',
  'Wack-wack': '1552',
  'Barangka': '1554',
  'Plainview': '1550',
  'Addition Hills': '1550',
  
  // San Juan
  'San Juan': '1500',
  'San Juan City': '1500',
  'Greenhills': '1502',
  'Ermitaño': '1500',
  'Santa Lucia': '1501',
  
  // Marikina
  'Marikina': '1800',
  'Marikina City': '1800',
  'Concepcion': '1807',
  'Parang': '1809',
  'Tumana': '1800',
  'Barangka M': '1803',
  
  // Parañaque (with ñ)
  'Parañaque': '1700',
  'Parañaque City': '1700',
  'Paranaque': '1700', // Alternative spelling without ñ
  'Paranaque City': '1700',
  'Baclaran P': '1700',
  'BF Homes': '1720',
  'Don Bosco': '1711',
  'Marcelo Green': '1700',
  'San Dionisio': '1700',
  'San Isidro P': '1700',
  'Sun Valley': '1703',
  'Tambo': '1701',
  
  // Las Piñas
  'Las Piñas': '1740',
  'Las Piñas City': '1740',
  'Pulang Lupa': '1742',
  'Talon': '1747',
  'Zapote': '1740',
  
  // Muntinlupa
  'Muntinlupa': '1770',
  'Muntinlupa City': '1770',
  'Alabang': '1780',
  'Bayanan': '1772',
  'Cupang': '1771',
  'Poblacion M': '1776',
  
  // Valenzuela
  'Valenzuela': '1440',
  'Valenzuela City': '1440',
  'Arkong Bato': '1446',
  'Dalandanan': '1443',
  'Malinta': '1440',
  'Polo': '1444',
  
  // Malabon
  'Malabon': '1470',
  'Malabon City': '1470',
  'Baritan': '1477',
  'Concepcion M': '1471',
  'Tonsuya': '1473',
  
  // Navotas
  'Navotas': '1485',
  'Navotas City': '1485',
  'Bagumbayan North': '1489',
  'Bangculasi': '1485',
  'Tanza': '1489',
  
  // Caloocan
  'Caloocan': '1400',
  'Caloocan City': '1400',
  'Bagong Silang': '1428',
  'Camarin': '1420',
  'Grace Park': '1403',
  'Sangandaan': '1406',
  
  // Pateros
  'Pateros': '1620',
  'Pateros, Metro Manila': '1620',
  'Pateros City': '1620',
  
  // Nearby Rizal areas
  'Cainta': '1900',
  'Cainta, Rizal': '1900',
  'Antipolo': '1870',
  'Antipolo City': '1870',
  'Taytay': '1920',
  'Taytay, Rizal': '1920',
  'Angono': '1930',
  'Angono, Rizal': '1930',
  'Binangonan': '1940',
  'Binangonan, Rizal': '1940',
  
  // Common barangay patterns
  'Brgy. ': '', // Will be handled specially
};

// Delivery fee configuration - UPDATED WITH PATEROS
const DELIVERY_FEE_CONFIG = {
  // Same zip code - lowest fee
  '1602': 50, // Pinagbuhatan Pasig
  
  // Nearby Pasig areas
  '1600': 80, // Pasig proper
  '1601': 80,
  '1603': 80,
  '1604': 80,
  '1605': 80,
  '1606': 80,
  '1607': 80,
  '1608': 80,
  '1609': 80,
  '1610': 80,
  '1611': 80,
  
  // Adjacent cities
  '1550': 100, // Mandaluyong
  '1551': 100,
  '1500': 100, // San Juan
  '1200': 100, // Makati
  '1620': 100, // Pateros
  
  // Central Metro Manila
  '1000': 120, // Manila
  '1001': 120,
  '1002': 120,
  '1003': 120,
  '1004': 120,
  '1005': 120,
  '1100': 120, // Quezon City
  '1101': 120,
  '1102': 120,
  '1103': 120,
  '1300': 120, // Pasay
  '1301': 120,
  '1302': 120,
  
  // Southern Metro Manila
  '1630': 150, // Taguig
  '1631': 150,
  '1632': 150,
  '1700': 150, // Parañaque
  '1740': 150, // Las Piñas
  '1770': 150, // Muntinlupa
  
  // Northern Metro Manila
  '1400': 180, // Caloocan
  '1440': 180, // Valenzuela
  '1470': 180, // Malabon
  '1485': 180, // Navotas
  
  // Rizal province
  '1900': 200, // Cainta
  '1870': 220, // Antipolo
  '1920': 220, // Taytay
  
  // Default fee for other areas
  'default': 250,
};

// Helper function to extract city from address
function extractCityFromAddress(address: string): string | null {
  if (!address) return null;
  
  // Split by comma and get the city part
  const parts = address.split(',');
  
  // Try different positions since format can vary
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]?.trim();
    if (part && (part.toLowerCase().includes('city') || 
        (part.length > 0 && 
         !part.toLowerCase().includes('brgy') &&
         !part.toLowerCase().includes('street') &&
         !part.toLowerCase().includes('st') &&
         !part.toLowerCase().includes('ave') &&
         !part.toLowerCase().includes('avenue') &&
         !part.toLowerCase().includes('metro manila')))) {
      return part;
    }
  }
  
  // Fallback: return the 3rd last part (common format)
  if (parts.length >= 3) {
    return parts[parts.length - 2]?.trim() || null;
  }
  
  return null;
}

// Helper function to extract barangay from address
function extractBarangayFromAddress(address: string): string | null {
  if (!address) return null;
  
  const parts = address.split(',');
  
  // Look for barangay pattern
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.toLowerCase().includes('brgy') || 
        trimmed.toLowerCase().includes('barangay') ||
        (trimmed.length > 0 && 
         !trimmed.toLowerCase().includes('city') &&
         !trimmed.toLowerCase().includes('metro manila') &&
         !trimmed.toLowerCase().includes('street') &&
         parts.length >= 2 && part === parts[1])) {
      // Remove "Brgy." prefix if present
      return trimmed.replace(/^Brgy\.?\s*/i, '').replace(/^Barangay\s*/i, '').trim();
    }
  }
  
  // If no barangay pattern found, return the 2nd part (common position)
  if (parts.length >= 2) {
    return parts[1]?.trim() || null;
  }
  
  return null;
}

// Get zip code from city/barangay mapping
function getZipCodeFromAddress(address: string): string | null {
  if (!address) return null;
  
  // First, try to extract explicit zip code from address
  const zipCodeMatch = address.match(/\b(\d{4})\b/);
  if (zipCodeMatch) {
    return zipCodeMatch[1];
  }
  
  // Try to extract barangay
  const barangay = extractBarangayFromAddress(address);
  if (barangay) {
    // Try exact match
    if (CITY_ZIP_MAPPING[barangay]) {
      return CITY_ZIP_MAPPING[barangay];
    }
    
    // Try with "Brgy. " prefix
    const brgyKey = `Brgy. ${barangay}`;
    if (CITY_ZIP_MAPPING[brgyKey]) {
      return CITY_ZIP_MAPPING[brgyKey];
    }
  }
  
  // Try to extract city
  const city = extractCityFromAddress(address);
  if (city) {
    // Try exact match first
    if (CITY_ZIP_MAPPING[city]) {
      return CITY_ZIP_MAPPING[city];
    }
    
    // Try variations
    const cityLower = city.toLowerCase();
    
    // Remove "City" suffix
    const cityWithoutSuffix = city.replace(/\s*City$/i, '');
    if (CITY_ZIP_MAPPING[cityWithoutSuffix]) {
      return CITY_ZIP_MAPPING[cityWithoutSuffix];
    }
    
    // Try common city name patterns
    const cityMappings: Record<string, string> = {
      'pasay': '1300',
      'pasig': '1600',
      'makati': '1200',
      'manila': '1000',
      'quezon': '1100',
      'taguig': '1630',
      'mandaluyong': '1550',
      'san juan': '1500',
      'marikina': '1800',
      'parañaque': '1700', // Added with ñ
      'paranaque': '1700', // Alternative without ñ
      'las piñas': '1740',
      'muntinlupa': '1770',
      'valenzuela': '1440',
      'malabon': '1470',
      'navotas': '1485',
      'caloocan': '1400',
      'pateros': '1620', // Added Pateros
      'cainta': '1900',
      'antipolo': '1870',
    };
    
    for (const [cityName, zipCode] of Object.entries(cityMappings)) {
      if (cityLower.includes(cityName)) {
        return zipCode;
      }
    }
  }
  
  return null;
}

// Calculate delivery fee based on zip code
function calculateDeliveryFee(zipCode: string | null): number {
  if (!zipCode) return DELIVERY_FEE_CONFIG.default;
  
  // Check if we have a specific fee for this zip code
  if (DELIVERY_FEE_CONFIG[zipCode as keyof typeof DELIVERY_FEE_CONFIG]) {
    return DELIVERY_FEE_CONFIG[zipCode as keyof typeof DELIVERY_FEE_CONFIG];
  }
  
  // Check if it's a nearby zip code (first 2 digits match)
  const storeFirstTwo = STORE_ZIP_CODE.substring(0, 2);
  const zipFirstTwo = zipCode.substring(0, 2);
  
  if (storeFirstTwo === zipFirstTwo) {
    return 100; // Same city but different area
  }
  
  // Check if it's in Metro Manila (starts with certain prefixes)
  const metroManilaPrefixes = ['10', '11', '12', '13', '14', '15', '16', '17', '18'];
  if (metroManilaPrefixes.includes(zipFirstTwo)) {
    return 200; // Other Metro Manila areas
  }
  
  return DELIVERY_FEE_CONFIG.default;
}

// Get delivery zone name for display - CORRECTED FUNCTION NAME
function getDeliveryZone(zipCode: string | null): string {
  if (!zipCode) return 'Unknown Location';
  
  if (zipCode === STORE_ZIP_CODE) return 'Same Area as Store (Lowest Fee)';
  
  const fee = calculateDeliveryFee(zipCode);
  
  switch (fee) {
    case 50:
      return 'Pinagbuhatan Area';
    case 80:
      return 'Pasig City';
    case 100:
      return 'Adjacent Cities';
    case 120:
      return 'Central Metro Manila';
    case 150:
      return 'Southern/Northern Metro Manila';
    case 180:
      return 'Northern Metro Manila';
    case 200:
      return 'Rizal Province';
    case 220:
      return 'Antipolo/Taytay Area';
    case 250:
      return 'Other Areas';
    default:
      return 'Standard Delivery';
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [mounted, setMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const items = useCartStore((state) => state.items ?? []);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
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
  const [citiesData, setCitiesData] = useState<any[]>([]); // To store fetched cities data
  const [zipCodeMapping, setZipCodeMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch cities data on mount for better zip code matching
  useEffect(() => {
    // Fetch cities from the same API used in registration
    fetch('https://psgc.gitlab.io/api/regions/130000000/cities-municipalities')
      .then(res => res.json())
      .then(data => {
        setCitiesData(data);
        
        // Create a mapping from city names to common zip codes
        const mapping: Record<string, string> = {};
        
        data.forEach((city: any) => {
          const cityName = city.name;
          // Map city name to common zip code
          // Note: This is simplified - in production you'd want a more complete mapping
          if (cityName.includes('Pasig')) mapping[cityName] = '1600';
          else if (cityName.includes('Pasay')) mapping[cityName] = '1300';
          else if (cityName.includes('Makati')) mapping[cityName] = '1200';
          else if (cityName.includes('Manila')) mapping[cityName] = '1000';
          else if (cityName.includes('Quezon')) mapping[cityName] = '1100';
          else if (cityName.includes('Taguig')) mapping[cityName] = '1630';
          else if (cityName.includes('Mandaluyong')) mapping[cityName] = '1550';
          else if (cityName.includes('San Juan')) mapping[cityName] = '1500';
          else if (cityName.includes('Marikina')) mapping[cityName] = '1800';
          else if (cityName.includes('Parañaque') || cityName.includes('Paranaque')) mapping[cityName] = '1700';
          else if (cityName.includes('Las Piñas')) mapping[cityName] = '1740';
          else if (cityName.includes('Muntinlupa')) mapping[cityName] = '1770';
          else if (cityName.includes('Valenzuela')) mapping[cityName] = '1440';
          else if (cityName.includes('Malabon')) mapping[cityName] = '1470';
          else if (cityName.includes('Navotas')) mapping[cityName] = '1485';
          else if (cityName.includes('Caloocan')) mapping[cityName] = '1400';
        });
        
        setZipCodeMapping(mapping);
      })
      .catch(err => console.error('Failed to fetch cities data:', err));
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

  // Calculate delivery fee when address changes
  useEffect(() => {
    if (formData.deliveryAddress) {
      const zipCode = getZipCodeFromAddress(formData.deliveryAddress);
      setEstimatedZipCode(zipCode);
      const fee = calculateDeliveryFee(zipCode);
      setDeliveryFee(fee);
      
      // Show warning if we can't determine zip code
      if (!zipCode) {
        // Try to provide more specific guidance
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setZipCodeError('');
    
    // Validate address and zip code
    const zipCode = getZipCodeFromAddress(formData.deliveryAddress);
    if (!zipCode) {
      const city = extractCityFromAddress(formData.deliveryAddress);
      if (city && citiesData.length > 0) {
        // Check if city exists in our database
        const foundCity = citiesData.find(c => 
          c.name.toLowerCase().includes(city.toLowerCase()) || 
          city.toLowerCase().includes(c.name.toLowerCase())
        );
        
        if (foundCity) {
          // We found the city but couldn't map to zip code
          setZipCodeError(`We've detected "${city}" but couldn't determine the exact zip code. Please update your address to include more specific location details.`);
        } else {
          setZipCodeError(`Unable to verify "${city}" as a valid Metro Manila city. Please check your address.`);
        }
      } else {
        setZipCodeError('Unable to determine delivery location. Please ensure your address is complete and includes the city name.');
      }
      return;
    }
    
    setLoading(true);
    
    if (!items.length) {
      setError('Your cart is empty.');
      setLoading(false);
      return;
    }

    try {
      const orderData = {
        ...formData,
        paymentMethod: formData.paymentMethod.toUpperCase(),
        userId: (session?.user as any)?.id,
        items,
        deliveryFee,
        subtotal: getTotalPrice?.(),
        total: (getTotalPrice?.() ?? 0) + deliveryFee,
        deliveryZipCode: zipCode,
        userLocationData,
      };

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

      // COD FLOW
      if (formData.paymentMethod === 'COD') {
        clearCart();
        router.push(`/order-confirmation/${data.order.orderNumber}`);
        return;
      }

      // GCASH FLOW
      if (formData.paymentMethod === 'GCASH') {
        if (!data?.checkoutUrl) {
          throw new Error('No checkout URL returned from PayMongo');
        }
        window.location.href = data.checkoutUrl;
        return;
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Something went wrong');
      setLoading(false);
    }
  };

  // Get address summary for display
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
  if (!mounted || checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gradient-to-b from-amber-50 to-white">
          <div className="container mx-auto max-w-4xl px-4 py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Authentication check - COMPLETE THE MISSING UI
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
                Please log in to your account to proceed with checkout. If you don't have an account yet, you can create one in just a few minutes.
              </p>
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-900">
                  <strong>Why do we require login?</strong>
                </p>
                <p className="text-sm text-amber-800 mt-2">
                  Creating an account helps us keep track of your orders, provide better customer service, and save your delivery information for faster checkout next time.
                </p>
              </div>
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

  const subtotal = getTotalPrice?.() ?? 0;
  const total = subtotal + deliveryFee;

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
                  Our store is located in Pinagbuhatan, Pasig (1602). Delivery fee is automatically calculated based on your city/barangay.
                </p>
                {estimatedZipCode && addressSummary && (
                  <div className="mt-2 text-xs bg-amber-100 p-2 rounded">
                    <span className="font-medium">Detected Location:</span> 
                    {addressSummary.barangay && ` ${addressSummary.barangay},`}
                    {addressSummary.city && ` ${addressSummary.city}`}
                    <span className="font-semibold ml-2">(ZIP: {estimatedZipCode})</span>
                  </div>
                )}
              </div>
            </div>
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
                    <p>Please go to your profile settings to update your delivery address. Make sure to include the complete city name (e.g., "Pasig City") for accurate delivery fee calculation.</p>
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
                      <span>GCash (via PayMongo)</span>
                    </label>
                  </div>
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
                  {loading ? 'Processing...' : 'Place Order'}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-20">
                <h2 className="text-xl font-bold text-amber-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div
                      key={item.id + (item.variantId || '')}
                      className="flex justify-between text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {item.name} × {item.quantity}
                        </p>
                        {item.variantLabel && (
                          <p className="text-xs text-gray-500">
                            Variant: {item.variantLabel}
                          </p>
                        )}
                      </div>
                      <span className="font-semibold">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Delivery Fee Display */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₱{subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium">Delivery Fee</span>
                      {estimatedZipCode && (
                        <p className="text-xs text-gray-500">
                          {getDeliveryZone(estimatedZipCode)}
                          {estimatedZipCode === STORE_ZIP_CODE && (
                            <span className="text-green-600 font-medium"> (Same area as store)</span>
                          )}
                        </p>
                      )}
                    </div>
                    <span className="font-semibold">₱{deliveryFee.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t pt-3 flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>₱{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Delivery Info Note */}
                {deliveryFee > 0 && (
                  <div className="mt-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium mb-1">Delivery Fee Information:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Pinagbuhatan, Pasig (1602): ₱50</li>
                      <li>Other Pasig areas: ₱80</li>
                      <li>Adjacent cities: ₱100-₱120</li>
                      <li>Other Metro Manila: ₱150-₱200</li>
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