import { verifyAuth } from "#verifyAuth";
import { upload } from "#upload";
import { prisma } from "#prisma";
import { LogType } from "@prisma/client";

export const post = [
  verifyAuth,
  upload({
    // Image types
    allowedMimeTypes: "application/pdf",
    maxFileSize: 100 * 1024 * 1024, // 100 MB
  }),
  async (req, res) => {
    try {
      const { shopId, resourceTypeId, materialId } = req.params;
      const userId = req.user.id;

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId,
          shopId,
          active: true,
        },
      });

      if (!userShop) {
        return res.status(400).json({ error: "User is not part of this shop" });
      }

      if (userShop.accountType !== "ADMIN" && !req.user.admin) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const material = await prisma.material.findFirst({
        where: {
          id: materialId,
          resourceTypeId,
          shopId,
        },
      });

      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      await prisma.material.update({
        where: {
          id: materialId,
        },
        data: {
          msdsFileId: req.fileLog.id,
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
          material: {
            connect: {
              id: materialId,
            },
          },
          type: LogType.MATERIAL_MSDS_UPLOADED,
        },
      });

      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
];
