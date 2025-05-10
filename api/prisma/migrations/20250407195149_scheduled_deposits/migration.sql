-- CreateEnum
CREATE TYPE "automatedPostLedgerItemType" AS ENUM ('TOPUP', 'DEPOSIT');

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "automatedLedgerItemType" "LedgerItemType",
ADD COLUMN     "automatedLedgerItemValue" DOUBLE PRECISION;
