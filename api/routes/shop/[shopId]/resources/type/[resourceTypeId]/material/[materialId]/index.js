import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "@prisma/client";

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId } = req.params;
      const userId = req.user.id;
      const { materialId } = req.params;

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

      const material = await prisma.material.findFirst({
        where: {
          id: materialId,
          shopId,
          active: true,
        },
        include: {
          resourceType: true,
          tdsFile: true,
          msdsFile: true,
          images: {
            where: {
              active: true,
            },
            include: {
              file: true,
            },
          },
        },
      });

      if (
        !req.user.admin &&
        userShop.accountType !== "ADMIN" &&
        userShop.accountType !== "OPERATOR"
      ) {
        if (!material.costPublic) {
          delete material.costPerUnit;
          delete material.unitDescriptor;
        }
      }

      res.json({ material });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
];

export const put = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;
    const userId = req.user.id;
    const { materialId } = req.params;

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

    if (!req.user.admin || !userShop.accountType === "ADMIN") {
      return res.status(400).json({ message: "Unauthorized" });
    }

    delete req.body.id;
    delete req.body.resourceType;
    delete req.body.createdAt;
    delete req.body.updatedAt;
    delete req.body.active;
    delete req.body.shopId;
    delete req.body.images;

    req.body.costPerUnit = parseFloat(req.body.costPerUnit);

    const material = await prisma.material.update({
      where: {
        id: materialId,
      },
      data: req.body,
      include: {
        resourceType: true,
        images: {
          where: {
            active: true,
          },
        },
      },
    });

    await prisma.logs.create({
      data: {
        userId,
        shopId,
        type: LogType.MATERIAL_MODIFIED,
        materialId: material.id,
      },
    });

    if (
      !req.user.admin &&
      userShop.accountType !== "ADMIN" &&
      userShop.accountType !== "OPERATOR"
    ) {
      if (!material.costPublic) {
        delete material.costPerUnit;
        delete material.unitDescriptor;
      }
    }

    res.json({ material });
  },
];

export const del = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;
    const userId = req.user.id;
    const { materialId } = req.params;

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

    if (!req.user.admin || !userShop.accountType === "ADMIN") {
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

    await prisma.material.update({
      where: {
        id: material.id,
      },
      data: {
        active: false,
      },
    });

    await prisma.logs.create({
      data: {
        userId,
        shopId,
        type: LogType.MATERIAL_DELETED,
        materialId: material.id,
        resourceTypeId: material.resourceTypeId,
      },
    });

    res.json({ message: "Material deleted" });
  },
];
