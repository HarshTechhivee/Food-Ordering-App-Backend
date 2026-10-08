/*
  Warnings:

  - A unique constraint covering the columns `[stripeRefundId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "stripeRefundId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeRefundId_key" ON "Order"("stripeRefundId");
