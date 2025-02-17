-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "materialQty" DOUBLE PRECISION,
ADD COLUMN     "secondaryMaterialQty" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "JobItem" ADD COLUMN     "secondaryMaterialId" TEXT,
ADD COLUMN     "secondaryMaterialQty" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "JobItem" ADD CONSTRAINT "JobItem_secondaryMaterialId_fkey" FOREIGN KEY ("secondaryMaterialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;
