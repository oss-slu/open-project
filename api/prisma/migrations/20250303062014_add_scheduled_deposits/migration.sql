/*
  Warnings:

  - Added the required column `automatedLedgerItemType` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "automatedPostLedgerItemType" AS ENUM ('TOPUP', 'DEPOSIT');

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "automatedLedgerItemType" "LedgerItemType" NOT NULL,
ADD COLUMN     "automatedLedgerItemValue" DOUBLE PRECISION;
