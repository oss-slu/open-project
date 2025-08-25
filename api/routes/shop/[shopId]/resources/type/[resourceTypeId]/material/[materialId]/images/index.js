import { verifyAuth } from "#verifyAuth";
import { upload } from "#upload";
import { prisma } from "#prisma";
import { LogType } from "@prisma/client";

export const post = [
  verifyAuth,
  upload({
    // Image types
    allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg"],
    maxFileSize: 100 * 1024 * 1024, // 100 MB
  }),
  async (req, res) => {
    try {
      const { shopId, resourceTypeId, materialId } = req.params;
      const userId = req.user.id;

      const material = await prisma.material.findFirst({
        where: {
          id: materialId,
          shopId,
          resourceTypeId,
        },
      });

      if (!material) {
        return res.status(404).json({ error: "Not found" });
      }

      const userShop = await prisma.userShop.findFirst({
        where: {
          shopId,
          userId,
          active: true,
        },
      });

      if (!req.user.admin && !userShop?.accountType === "ADMIN") {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const newImage = await prisma.materialImage.create({
        data: {
          materialId: material.id,
          fileId: req.fileLog.id,
        },
      });

      await prisma.logs.create({
        data: {
          user: {
            connect: {
              id: userId,
            },
          },
          shop: {
            connect: {
              id: shopId,
            },
          },
          type: LogType.MATERIAL_IMAGE_CREATED,
          materialImage: {
            connect: {
              id: newImage.id,
            },
          },
        },
      });

      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
];
