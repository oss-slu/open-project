import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "@prisma/client";
import { z } from "zod";

const resourceSchema = z.object({
  title: z.string().min(1, "Resouce must have title"),
  shopId: z.string().min(1, "Shop must have ID")
});

export const get = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;

    const userShop = prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId: shopId,
        active: true,
      },
    });

    if (!userShop) {
      res.status(400).json({
        message: "Unauthorized",
      });
    }

    const resourceTypes = await prisma.resourceType.findMany({
      where: {
        shopId: shopId,
        active: true,
      },
      include: {
        resources: {
          where: {
            active: true,
          },
          include: {
            images: {
              where: {
                active: true,
              },
            },
          },
        },
      },
    });

    res.json({ resourceTypes });
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    const { shopId } = req.params;

    const userShop = prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId: shopId,
        active: true,
      },
    });

    if (!userShop) {
      res.status(400).json({
        message: "Unauthorized",
      });
    }

    if (
      !req.user.admin &&
      userShop.accountType !== "ADMIN" &&
      userShop.accountType !== "OPERATOR"
    ) {
      res.status(400).json({
        message: "Unauthorized",
      });
    }

    const validationResult = resourceSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid data",
          issues: validationResult.error.format(),
        });
      }

    const validatedData = validationResult.data;

    const resourceType = await prisma.resourceType.create({
      data: {
        title: validatedData.title,
        shopId: validatedData.shopId,
      },
    });

    await prisma.logs.create({
      data: {
        type: LogType.RESOURCE_TYPE_CREATED,
        userId: req.user.id,
        shopId,
        resourceTypeId: resourceType.id,
        to: JSON.stringify(resourceType),
      },
    });

    res.json({ resourceType });
  },
];
