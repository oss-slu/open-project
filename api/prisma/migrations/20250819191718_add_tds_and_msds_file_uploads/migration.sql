-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "msdsFileId" TEXT,
ADD COLUMN     "tdsFileId" TEXT;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_msdsFileId_fkey" FOREIGN KEY ("msdsFileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_tdsFileId_fkey" FOREIGN KEY ("tdsFileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
