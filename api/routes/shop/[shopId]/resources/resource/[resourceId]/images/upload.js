import prisma from "#prisma";
import { upload } from "#upload";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "@prisma/client";

export const post = [
  verifyAuth,
  upload({
    // Image types
    allowedMimeTypes: "image/jpeg,image/png,image/gif",
    maxFileSize: 100 * 1024 * 1024, // 100 MB
  }),
  async (req, res) => {
    try {
      const { shopId, resourceId } = req.params;
      const userId = req.user.id;

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId,
          shopId: shopId,
          active: true,
        },
      });

      if (!req.user.admin || userShop.accountType === "CUSTOMER") {
        return res.sendStatus(400);
      }

      const newImage = await prisma.resourceImage.create({
        data: {
          resourceId,
          fileId: req.fileLog.id,
        },
      });

      await prisma.logs.create({
        data: {
          userId,
          shopId,
          resourceId,
          resourceImageId: newImage.id,
          type: LogType.RESOURCE_IMAGE_CREATED,
        },
      });

      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
      return;
    }
  },
];
