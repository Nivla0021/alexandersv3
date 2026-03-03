-- Create Enums
CREATE TYPE "ProductType" AS ENUM ('in_store', 'online', 'both');
CREATE TYPE "PriceType" AS ENUM ('in_store', 'online');

-- =========================
-- User
-- =========================
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(254) NOT NULL UNIQUE,
    "emailVerified" TIMESTAMP,
    "image" TEXT,

    "discountApproved" BOOLEAN NOT NULL DEFAULT false,
    "discountType" TEXT,
    "discountApprovedAt" TIMESTAMP,
    "discountReviewedBy" TEXT,

    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'customer',

    "emailVerificationToken" VARCHAR(64) UNIQUE,
    "emailVerificationExpires" TIMESTAMP,
    "passwordResetToken" VARCHAR(64) UNIQUE,
    "passwordResetExpires" TIMESTAMP,

    "phone" VARCHAR(20),
    "address" VARCHAR(500),

    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- Account
-- =========================
CREATE TABLE "Account" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key"
ON "Account"("provider", "providerAccountId");

-- =========================
-- Session
-- =========================
CREATE TABLE "Session" (
    "id" TEXT PRIMARY KEY,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP NOT NULL,

    CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- =========================
-- VerificationToken
-- =========================
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expires" TIMESTAMP NOT NULL,

    CONSTRAINT "VerificationToken_identifier_token_key"
    UNIQUE ("identifier", "token")
);

-- =========================
-- Product
-- =========================
CREATE TABLE "Product" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT NOT NULL,
    "recipe" TEXT,
    "image" TEXT NOT NULL,
    "category" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "productType" "ProductType" NOT NULL DEFAULT 'both',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- ProductVariant
-- =========================
CREATE TABLE "ProductVariant" (
    "id" TEXT PRIMARY KEY,
    "label" TEXT NOT NULL,
    "inStorePrice" DOUBLE PRECISION,
    "onlinePrice" DOUBLE PRECISION,
    "productId" TEXT NOT NULL,

    CONSTRAINT "ProductVariant_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
);

-- =========================
-- SliderImage
-- =========================
CREATE TABLE "SliderImage" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "image" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- DiscountApproval
-- =========================
CREATE TABLE "discount_approvals" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "birthday" TIMESTAMP NOT NULL,
    "idNumber" TEXT NOT NULL,
    "idImageUrl" TEXT NOT NULL,
    "idImagePublicId" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountApproval_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "DiscountApproval_userId_idx" ON "discount_approvals"("userId");
CREATE INDEX "DiscountApproval_status_idx" ON "discount_approvals"("status");
CREATE INDEX "DiscountApproval_createdAt_idx" ON "discount_approvals"("createdAt");

-- =========================
-- Order
-- =========================
CREATE TABLE "Order" (
    "id" TEXT PRIMARY KEY,
    "orderNumber" TEXT NOT NULL UNIQUE,
    "transactionNumber" TEXT UNIQUE,

    "orderSource" TEXT NOT NULL DEFAULT 'ONLINE',
    "orderMode" TEXT,

    "userId" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "deliveryAddress" TEXT,
    "orderNotes" TEXT,

    "subtotal" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,

    "orderStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "paymentMethod" TEXT NOT NULL DEFAULT 'COD',

    "deliveryZipCode" TEXT,
    "locationData" TEXT,
    "gcashReference" TEXT,
    "gcashReceiptUrl" TEXT,

    "discountApplied" BOOLEAN NOT NULL DEFAULT false,
    "discountType" TEXT,
    "discountAmount" DOUBLE PRECISION DEFAULT 0,
    "discountApprovalId" TEXT,
    "discountDetails" JSONB,

    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id"),

    CONSTRAINT "Order_discountApprovalId_fkey"
    FOREIGN KEY ("discountApprovalId") REFERENCES "discount_approvals"("id")
);

-- =========================
-- OrderItem
-- =========================
CREATE TABLE "OrderItem" (
    "id" TEXT PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "variantLabel" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "priceType" "PriceType",
    "discountApplied" BOOLEAN NOT NULL DEFAULT false,
    "discountAmount" DOUBLE PRECISION DEFAULT 0,
    "discountedPrice" DOUBLE PRECISION,
    "isHighestPriced" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OrderItem_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,

    CONSTRAINT "OrderItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
);

-- =========================
-- ProductSale
-- =========================
CREATE TABLE "ProductSale" (
    "id" TEXT PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "priceType" "PriceType",
    "quantity" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "soldAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSale_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id"),

    CONSTRAINT "ProductSale_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,

    CONSTRAINT "ProductSale_orderId_productId_key"
    UNIQUE ("orderId", "productId")
);

CREATE INDEX "ProductSale_soldAt_idx" ON "ProductSale"("soldAt");

-- =========================
-- ContactSubmission
-- =========================
CREATE TABLE "ContactSubmission" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- Testimonial
-- =========================
CREATE TABLE "Testimonial" (
    "id" TEXT PRIMARY KEY,
    "customerName" TEXT NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- FAQ
-- =========================
CREATE TABLE "FAQ" (
    "id" SERIAL PRIMARY KEY,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- GCashQRCode
-- =========================
CREATE TABLE "gcash_qr_codes" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "amount" DOUBLE PRECISION,
    "description" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- Setting
-- =========================
CREATE TABLE "Setting" (
    "id" TEXT PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);