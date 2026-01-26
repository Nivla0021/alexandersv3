/*
  Warnings:

  - You are about to alter the column `message` on the `Testimonial` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.

*/
-- AlterTable
ALTER TABLE "Testimonial" ALTER COLUMN "message" SET DATA TYPE VARCHAR(500);
