// /api/orders/route.ts
import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// ============ TYPE DEFINITIONS ============
interface ClientOrderItem {
  id: string;
  variantId?: string;
  variantLabel?: string;
  quantity: number;
  price?: number; // Client sent price (ignored by server)
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  variantId: string | null;
  variantLabel: string | null;
}

interface ValidatedOrderItem extends OrderItem {
  discountApplied: boolean;
  discountAmount: number;
  discountedPrice: number;
  isHighestPriced: boolean;
}

interface ProductSaleItem {
  id: string;
  name: string;
  category: string | null;
  price: number;
  quantity: number;
  variantLabel: string | null;
}

interface DiscountDetails {
  type: string;
  totalDiscount: number;
  calculationMethod: string;
  appliedToItem: {
    id: string;
    name: string;
    originalPrice: number;
    quantity: number;
    discountAmount: number;
    discountedPrice: number;
    variantId: string | null;
    variantLabel: string | null;
  };
  itemsConsidered: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    variantLabel: string | null;
  }>;
  discountApprovalId: string | null;
}

interface DeliveryZone {
  zipCodes: string[];
  fee: number;
}

// ============ UTILITY FUNCTIONS ============
function random4(): number {
  return Math.floor(1000 + Math.random() * 9000);
}

function generateOrderNumber(orderSource: string, orderMode?: string | null): string {
  const rnd = random4();

  if (orderSource === 'ONLINE') return `ONL-${rnd}`;
  if (orderSource === 'KIOSK') {
    if (orderMode === 'DINE-IN') return `SDI-${rnd}`;
    if (orderMode === 'TAKEOUT') return `STO-${rnd}`;
  }
  return `GEN-${rnd}`; // fallback
}

function generateTransactionNumber(): string {
  const today = new Date().toISOString().slice(0,10).replace(/-/g,''); // YYYYMMDD
  const rnd = Math.floor(10000 + Math.random() * 90000); // 5 digits
  return `${today}${rnd}`;
}

// Delivery fee configuration (should match frontend)
const DELIVERY_ZONES: DeliveryZone[] = [
  { zipCodes: ['1602'], fee: 50 },
  { zipCodes: ['1600', '1601', '1603', '1604', '1605', '1606', '1607', '1608', '1609', '1610', '1611'], fee: 80 },
  { zipCodes: ['1550', '1551', '1500', '1200', '1620'], fee: 100 },
  { zipCodes: ['1000', '1001', '1002', '1003', '1004', '1005', '1100', '1101', '1102', '1103', '1300', '1301', '1302'], fee: 120 },
  { zipCodes: ['1630', '1631', '1632', '1700', '1740', '1770'], fee: 150 },
  { zipCodes: ['1400', '1440', '1470', '1485'], fee: 180 },
  { zipCodes: ['1900', '1870', '1920', '1930', '1940'], fee: 220 },
];

function calculateDeliveryFee(zipCode: string | null): number {
  if (!zipCode) return 250;
  const zone = DELIVERY_ZONES.find(z => z.zipCodes.includes(zipCode));
  return zone?.fee || 250;
}

// ============ MAIN API HANDLER ============
export async function POST(request: Request) {
  try {
      const body = await request.json();

      // Extract only NECESSARY fields - ignore client-calculated totals
      const {
        orderSource = 'ONLINE',
        orderMode,
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        orderNotes,
        items: clientItems, // We'll validate these against DB
        paymentMethod,
        userId,
        deliveryZipCode,
        userLocationData,
        
        // Discount fields - we'll validate these
        discountApplied = false,
        discountType,
        discountApprovalId,
        
        // IGNORE these client-provided values for security:
        // subtotal, total, discountAmount, discountDetails
      } = body;

      // Validation
      if (!clientItems?.length) {
        return NextResponse.json(
          { error: 'Order must contain at least one item' },
          { status: 400 }
        );
      }

      if (orderSource === 'ONLINE') {
        if (!customerName || !customerEmail || !customerPhone || !deliveryAddress) {
          return NextResponse.json(
            { error: 'Missing required customer fields' },
            { status: 400 }
          );
        }
      }

      // ============ SECURITY: VERIFY PRODUCTS AND VARIANTS FROM DATABASE ============
      // Get all product IDs from the order
      const productIds = clientItems.map((item: ClientOrderItem) => item.id);
      const variantIds = clientItems
        .filter((item: ClientOrderItem) => item.variantId)
        .map((item: ClientOrderItem) => item.variantId as string);

      // Fetch actual products from database with updated schema
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { 
          id: true, 
          name: true,
          category: true,
          productType: true,
          variants: {
            select: {
              id: true,
              label: true,
              inStorePrice: true,
              onlinePrice: true,
            }
          }
        }
      });

      // Create maps for quick lookup
      const productMap = new Map(products.map(p => [p.id, p]));
      
      // Create variant price map - use onlinePrice for online orders
      const variantPriceMap = new Map<string, number>();
      products.forEach(product => {
        product.variants.forEach(variant => {
          // For online orders, use onlinePrice
          if (orderSource === 'ONLINE') {
            variantPriceMap.set(variant.id, variant.onlinePrice);
          } else {
            // For kiosk/offline, use inStorePrice
            variantPriceMap.set(variant.id, variant.inStorePrice);
          }
        });
      });

      // ============ SECURITY: VALIDATE AND RECALCULATE ORDER ITEMS ============
      let serverSubtotal = 0;
      const validatedItems: ValidatedOrderItem[] = [];
      const itemsForProductSales: ProductSaleItem[] = [];

      for (const clientItem of clientItems) {
        const dbProduct = productMap.get(clientItem.id);
        
        // Reject if product doesn't exist in database
        if (!dbProduct) {
          return NextResponse.json(
            { error: `Product with ID ${clientItem.id} not found` },
            { status: 400 }
          );
        }

        // Determine the correct price based on variant and order source
        let price: number | null = null;
        
        if (clientItem.variantId) {
          // If item has a variant, get price from variant
          price = variantPriceMap.get(clientItem.variantId);
          
          if (price === undefined || price === null) {
            return NextResponse.json(
              { error: `Variant with ID ${clientItem.variantId} not found or has no valid price for ${orderSource} orders` },
              { status: 400 }
            );
          }
        } else {
          // If no variant, check if product has variants
          if (dbProduct.variants.length > 0) {
            // Try to find a variant with appropriate price
            const defaultVariant = dbProduct.variants.find(v => 
              orderSource === 'ONLINE' ? v.onlinePrice : v.inStorePrice
            );
            
            if (defaultVariant) {
              price = orderSource === 'ONLINE' ? defaultVariant.onlinePrice : defaultVariant.inStorePrice;
            } else {
              return NextResponse.json(
                { error: `Product ${dbProduct.name} has no ${orderSource === 'ONLINE' ? 'online' : 'in-store'} price configured` },
                { status: 400 }
              );
            }
          } else {
            return NextResponse.json(
              { error: `Product ${dbProduct.name} has no variants configured` },
              { status: 400 }
            );
          }
        }

        // Validate quantity (must be positive integer)
        const quantity = Math.max(1, Math.floor(Number(clientItem.quantity) || 1));
        
        // Calculate item subtotal
        const itemSubtotal = price * quantity;
        serverSubtotal += itemSubtotal;

        // Find variant label
        const variant = dbProduct.variants.find(v => v.id === clientItem.variantId);
        const variantLabel = variant?.label || clientItem.variantLabel || null;

        // Store validated item data (without discount fields yet)
        const baseItem: OrderItem = {
          productId: dbProduct.id,
          quantity,
          price, // Using validated price from DB
          variantId: clientItem.variantId || null,
          variantLabel: variantLabel,
        };

        validatedItems.push({
          ...baseItem,
          discountApplied: false,
          discountAmount: 0,
          discountedPrice: 0, // Will be set after discount calculation
          isHighestPriced: false,
        });

        // For product sales (analytics)
        itemsForProductSales.push({
          id: dbProduct.id,
          name: dbProduct.name,
          category: dbProduct.category,
          price,
          quantity,
          variantLabel,
        });
      }

      // ============ SECURITY: VALIDATE DELIVERY FEE ============
      // For KIOSK orders, delivery fee should always be 0
      const serverDeliveryFee = orderSource === 'KIOSK' 
        ? 0 
        : calculateDeliveryFee(deliveryZipCode);

      // ============ SECURITY: VALIDATE DISCOUNT ============
      let serverDiscountApplied = false;
      let serverDiscountType: string | null = null;
      let serverDiscountAmount = 0;
      let serverDiscountApprovalId: string | null = null;
      let serverDiscountDetails: DiscountDetails | null = null;
      let highestPricedItem: ValidatedOrderItem | null = null;
      let highestPricedItemIndex = -1;

      // Only process discount if claimed
      if (discountApplied) {
        // Verify discount type is valid
        if (discountType !== 'PWD' && discountType !== 'SENIOR') {
          return NextResponse.json(
            { error: 'Invalid discount type' },
            { status: 400 }
          );
        }

        // If discountApprovalId provided, verify it exists and is approved
        if (discountApprovalId) {
          const approval = await prisma.discountApproval.findUnique({
            where: { id: discountApprovalId },
            select: { 
              id: true, 
              status: true, 
              discountType: true,
              userId: true 
            }
          });

          // Verify approval exists, is approved, matches user, and discount type matches
          if (!approval || 
              approval.status !== 'APPROVED' || 
              approval.userId !== userId ||
              approval.discountType !== discountType) {
            return NextResponse.json(
              { error: 'Invalid or expired discount approval' },
              { status: 400 }
            );
          }

          serverDiscountApprovalId = approval.id;
        } else {
          // If no approval ID, check if user has global approval
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { 
              discountApproved: true, 
              discountType: true,
            }
          });

          if (!user?.discountApproved || user.discountType !== discountType) {
            return NextResponse.json(
              { error: 'User not approved for this discount type' },
              { status: 400 }
            );
          }
        }

        // Find the highest priced item from VALIDATED items
        // Compare by price per unit, not total
        let highestPrice = -1;
        
        validatedItems.forEach((item, index) => {
          if (item.price > highestPrice) {
            highestPrice = item.price;
            highestPricedItem = item;
            highestPricedItemIndex = index;
          }
        });

        if (!highestPricedItem) {
          return NextResponse.json(
            { error: 'Cannot apply discount: no items in order' },
            { status: 400 }
          );
        }

        // Calculate discount (20% of the highest priced item's SINGLE unit price)
        // NOT the total of multiple quantities
        const discountPerItem = highestPricedItem.price * 0.2;
        serverDiscountAmount = discountPerItem; // Apply to ONE quantity only
        
        // Mark that discount is applied
        serverDiscountApplied = true;
        serverDiscountType = discountType;

        // Find the product name for the discounted item
        const discountedProduct = itemsForProductSales.find(
          item => item.id === highestPricedItem?.productId
        );

        // Build discount details for storage
        serverDiscountDetails = {
          type: discountType,
          totalDiscount: serverDiscountAmount,
          calculationMethod: 'highest_priced_item',
          appliedToItem: {
            id: highestPricedItem.productId,
            name: discountedProduct?.name || 'Unknown',
            originalPrice: highestPricedItem.price,
            quantity: 1, // Only one item gets discount
            discountAmount: serverDiscountAmount,
            discountedPrice: highestPricedItem.price - serverDiscountAmount,
            variantId: highestPricedItem.variantId,
            variantLabel: highestPricedItem.variantLabel,
          },
          itemsConsidered: itemsForProductSales.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            variantLabel: item.variantLabel,
          })),
          discountApprovalId: serverDiscountApprovalId,
        };

        // Update the validated items to mark which one gets the discount
        for (let i = 0; i < validatedItems.length; i++) {
          const item = validatedItems[i];
          const isHighestPriced = i === highestPricedItemIndex;
          
          validatedItems[i] = {
            ...item,
            discountApplied: isHighestPriced,
            discountAmount: isHighestPriced ? serverDiscountAmount : 0,
            discountedPrice: isHighestPriced 
              ? (item.price * item.quantity) - serverDiscountAmount 
              : (item.price * item.quantity),
            isHighestPriced,
          };
        }
      } else {
        // No discount - mark all items as not discounted
        for (let i = 0; i < validatedItems.length; i++) {
          const item = validatedItems[i];
          validatedItems[i] = {
            ...item,
            discountApplied: false,
            discountAmount: 0,
            discountedPrice: item.price * item.quantity,
            isHighestPriced: false,
          };
        }
      }

      // ============ SECURITY: CALCULATE FINAL TOTALS ============
      const serverTotal = serverSubtotal + serverDeliveryFee - serverDiscountAmount;

      // Generate order numbers
      const orderNumber = generateOrderNumber(orderSource, orderMode);
      const transactionNumber = generateTransactionNumber();

      // Determine payment status based on method
      let paymentStatus = 'unpaid';
      let orderStatus = 'pending';
      
      if (paymentMethod === 'GCASH') {
        paymentStatus = 'unpaid';
        orderStatus = 'pending';
      } else if (paymentMethod === 'CASH' || paymentMethod === 'COD') {
        paymentStatus = 'unpaid';
        orderStatus = 'confirmed';
      }

      // ============ SECURITY: BUILD ORDER DATA WITH SERVER-CALCULATED VALUES ============
      const orderData: Prisma.OrderCreateInput = {
        orderNumber,
        orderSource,
        transactionNumber,
        orderMode: orderSource === 'KIOSK' ? orderMode : null,

        customerName: orderSource === 'KIOSK' ? 'Walk-in' : customerName,
        customerEmail: orderSource === 'KIOSK' ? null : customerEmail,
        customerPhone: orderSource === 'KIOSK' ? null : customerPhone,
        deliveryAddress: orderSource === 'KIOSK' ? null : deliveryAddress,

        orderNotes,
        
        // SERVER-CALCULATED TOTALS - IGNORE CLIENT VALUES
        subtotal: serverSubtotal,
        total: serverTotal,
        deliveryFee: serverDeliveryFee,
        
        orderStatus,
        paymentStatus,
        paymentMethod,

        // Store additional delivery info
        deliveryZipCode: deliveryZipCode || null,
        locationData: userLocationData ? JSON.stringify(userLocationData) : null,

        // SERVER-VALIDATED DISCOUNT FIELDS
        discountApplied: serverDiscountApplied,
        discountType: serverDiscountType,
        discountAmount: serverDiscountAmount,
        discountDetails: serverDiscountDetails ? JSON.stringify(serverDiscountDetails) : null,
        
        // Connect to discount approval if validated
        ...(serverDiscountApprovalId && {
          discountApproval: {
            connect: {
              id: serverDiscountApprovalId
            }
          }
        }),

        // Use validated items with discount info - remove discount fields that aren't in schema
        orderItems: {
          create: validatedItems.map(({ discountApplied, discountAmount, discountedPrice, isHighestPriced, ...item }) => item),
        },
      };

      // Add user relation if userId is provided
      if (userId) {
        orderData.user = {
          connect: {
            id: userId
          }
        };
      }

      // Create order with all server-validated fields
      const order = await prisma.order.create({
        data: orderData,
        include: {
          orderItems: {
            include: { 
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                }
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            }
          },
          discountApproval: true,
        },
      });

      // Create product sales records for analytics using server-validated data
      // Uncomment if you have ProductSale model
      /*
      await Promise.all(
        itemsForProductSales.map((item) =>
          prisma.productSale.create({
            data: {
              productId: item.id,
              orderId: order.id,
              productName: item.name,
              category: item.category || null,
              unitPrice: item.price,
              quantity: item.quantity,
              total: item.price * item.quantity,
              soldAt: new Date(),
              // Add price type for tracking
              priceType: orderSource === 'ONLINE' ? 'online' : 'in_store',
            },
          })
        )
      );
      */

      // KIOSK response
      if (orderSource === 'KIOSK') {
        return NextResponse.json({ 
          order,
          message: 'Order created successfully'
        }, { status: 201 });
      }

      // ONLINE GCash QR Code
      if (paymentMethod === 'GCASH') {
        return NextResponse.json({ 
          order,
          requiresGcashPayment: true,
          gcashInstructions: {
            amount: serverTotal, // Use server-calculated total
            orderNumber: order.orderNumber,
            discountApplied: serverDiscountApplied ? {
              type: serverDiscountType,
              amount: serverDiscountAmount,
              itemName: serverDiscountDetails?.appliedToItem?.name || null,
            } : null,
          }
        }, { status: 201 });
      }

      // For COD or other payment methods
      return NextResponse.json({ 
        order,
        message: 'Order created successfully'
      }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating order:', error);
    
    let errorMessage = 'Failed to create order';
    let errorDetails = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      // Check if it's a Prisma error with meta property
      if ('meta' in error) {
        errorDetails = (error as any).meta;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}