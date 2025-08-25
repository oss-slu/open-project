import { LogType } from "@prisma/client";
import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { forceTestError } from "#forceError";
import { z } from "zod";

const resourceSchema = z.object({
  title: z.string().min(1, "Must have title"),
  //shopId: z.string().min(1, "Shop must have ID"),
  //resourceTypeId: z.string().min(1, "resouce must have ID")
});

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      forceTestError(req);

      // Make sure the user exists on the shop
      const { shopId } = req.params;

      const shop = await prisma.shop.findUnique({
        where: {
          id: shopId,
        },
      });

      if (!shop) {
        return res.status(404).json({ error: "Not found" });
      }

      const userId = req.user.id;
      const userShop = await prisma.userShop.findFirst({
        where: {
          shopId,
          userId,
          active: true,
        },
      });

      if (!userShop) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      let resources;

      if (userShop.accountType === "CUSTOMER" && !req.user.admin) {
        resources = await prisma.resource.findMany({
          where: {
            shopId,
            public: true,
            active: true,
          },
          include: {
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
      } else {
        resources = await prisma.resource.findMany({
          where: {
            shopId,
            active: true,
          },
          include: {
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
      }

      resources = resources.map((resource) => {
        if (
          req.user.admin ||
          userShop.accountType === "ADMIN" ||
          userShop.accountType === "OPERATOR"
        ) {
          return resource;
        }

        if (resource.quantityPublic) delete resource.quantity;

        if (resource.costingPublic) {
          delete resource.costPerProcessingTime;
          delete resource.costPerTime;
          delete resource.costPerUnit;
          delete resource.fixedCost;
        }

        return resource;
      });

      res.json({ resources });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        error: "Internal Server Error",
      });
    }
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    try {
      forceTestError(req);

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
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (userShop.accountType !== "ADMIN" && !req.user.admin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { title, resourceTypeId } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      if (!resourceTypeId) {
        return res.status(400).json({ error: "Resource Type is required" });
      }

      const validationResult = resourceSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid data",
          issues: validationResult.error.format(),
        });
      }

      const validatedData = validationResult.data;

      const resource = await prisma.resource.create({
        data: {
          title: validatedData.title,
          shopId,
          resourceTypeId,
        },
      });

      await prisma.logs.create({
        data: {
          userId,
          shopId,
          resourceId: resource.id,
          resourceTypeId: req.body.resourceTypeId,
          type: LogType.RESOURCE_CREATED,
        },
      });

      res.json({ resource });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        error: "Internal Server Error",
      });
    }
  },
];
