import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "@prisma/client";
import { utapi } from "../../../../../../../../../config/uploadthing.js";

export const del = [
  verifyAuth,
  async (req, res) => {
    const { shopId, materialId, imageId } = req.params;
    const userId = req.user.id;

    const userShop = await prisma.userShop.findFirst({
      where: {
        shopId,
        userId,
        active: true,
      },
    });

    if (!userShop) {
      return res.status(400).json({ message: "Unauthorized" });
    }

    if (!req.user.admin && !userShop.accountType === "ADMIN") {
      return res.status(400).json({ message: "Unauthorized" });
    }

    const material = await prisma.material.findFirst({
      where: {
        id: materialId,
        shopId,
      },
    });

    if (!material) {
      return res.status(404).json({ error: "Not found" });
    }

    const image = await prisma.materialImage.findFirst({
      where: {
        id: imageId,
        materialId,
      },
    });

    if (!image) {
      return res.status(404).json({ error: "Not found" });
    }

    await prisma.materialImage.update({
      where: {
        id: image.id,
      },
      data: {
        active: false,
      },
    });

    await prisma.logs.create({
      data: {
        userId,
        shopId,
        materialId,
        resourceTypeId: material.resourceTypeId,
        materialImageId: image.id,
        type: LogType.MATERIAL_IMAGE_DELETED,
      },
    });

    // await utapi.deleteFiles(image.fileKey);

    return res.json({ message: "Image deleted" });
  },
];
