/*
  Warnings:

  - A unique constraint covering the columns `[transactionNumber]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "orderMode" TEXT,
ADD COLUMN     "transactionNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_transactionNumber_key" ON "Order"("transactionNumber");
