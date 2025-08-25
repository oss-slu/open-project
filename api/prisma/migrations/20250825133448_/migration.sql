/*
  Warnings:

  - You are about to drop the column `fileKey` on the `JobItem` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `JobItem` table. All the data in the column will be lost.
  - You are about to drop the column `fileThumbnailKey` on the `JobItem` table. All the data in the column will be lost.
  - You are about to drop the column `fileThumbnailName` on the `JobItem` table. All the data in the column will be lost.
  - You are about to drop the column `fileThumbnailUrl` on the `JobItem` table. All the data in the column will be lost.
  - You are about to drop the column `fileType` on the `JobItem` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `JobItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "JobItem" DROP COLUMN "fileKey",
DROP COLUMN "fileName",
DROP COLUMN "fileThumbnailKey",
DROP COLUMN "fileThumbnailName",
DROP COLUMN "fileThumbnailUrl",
DROP COLUMN "fileType",
DROP COLUMN "fileUrl";
