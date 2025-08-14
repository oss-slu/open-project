-- AlterTable
ALTER TABLE "JobItem" ADD COLUMN     "fileId" TEXT,
ADD COLUMN     "thumbnailFileId" TEXT;

-- AddForeignKey
ALTER TABLE "JobItem" ADD CONSTRAINT "JobItem_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobItem" ADD CONSTRAINT "JobItem_thumbnailFileId_fkey" FOREIGN KEY ("thumbnailFileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
