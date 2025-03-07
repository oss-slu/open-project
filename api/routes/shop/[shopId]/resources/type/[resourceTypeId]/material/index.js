import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "@prisma/client";
import { z } from "zod";

const materialSchema = z.object({
  title: z.string().min(1, "Material must have Title"),
  manufacturer: z.string().optional(),
  resourceTypeId: z.string().min(1, "Resource must have ID"),
  costPerUnit: z.number().optional(),
  unitDescriptor: z.string().optional(),
  shopId: z.string().min(1, "Shop must have ID"),
});

export const get = [
  verifyAuth,
  async (req, res) => {
    const { shopId, resourceTypeId } = req.params;
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

    let materials = await prisma.material.findMany({
      where: {
        shopId,
        active: true,
        resourceTypeId,
      },
      include: {
        resourceType: true,
        images: {
          where: {
            active: true,
          },
        },
      },
    });

    if (
      !req.user.admin &&
      userShop.accountType !== "ADMIN" &&
      userShop.accountType !== "OPERATOR"
    ) {
      materials = materials.map((material) => {
        if (!material.costPublic) {
          delete material.costPerUnit;
          delete material.unitDescriptor;
        }
        return material;
      });
    }

    res.json({ materials });
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;
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

    if (!req.user.admin || !userShop.accountType === "ADMIN") {
      return res.status(400).json({ message: "Unauthorized" });
    }

    const validationResult = materialSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid data",
          issues: validationResult.error.format(),
        });
      }

    const validatedData = validationResult.data;

    const material = await prisma.material.create({
      data: {
        title: validatedData.title,
        manufacturer: validatedData.manufacturer,
        resourceTypeId: validatedData.resourceTypeId,
        costPerUnit: validatedData.costPerUnit,
        unitDescriptor: validatedData.unitDescriptor,
        shopId: validatedData.shopId,
      },
      include: {
        resourceType: true,
        images: {
          where: {
            active: true,
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

    await prisma.logs.create({
      data: {
        userId,
        shopId,
        type: LogType.MATERIAL_CREATED,
        materialId: material.id,
        resourceTypeId: material.resourceTypeId,
      },
    });

    res.json({ material });
  },
];
