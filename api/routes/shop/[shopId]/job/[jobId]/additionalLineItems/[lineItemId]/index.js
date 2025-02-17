import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { z } from "zod"

const shopSchema = z.object({
//
});

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId, jobId } = req.params;
      const userId = req.user.id;

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId,
          shopId,
          active: true,
        },
      });

      if (!userShop) {
        return res
          .status(400)
          .json({ error: "You are not a member of this shop" });
      }

      const shouldLoadAll =
        req.user.admin ||
        userShop.accountType === "ADMIN" ||
        userShop.accountType === "OPERATOR";

      const job = await prisma.job.findFirst({
        where: {
          id: jobId,
          shopId,
          userId: shouldLoadAll ? undefined : userId,
        },
      });

      if (!job) {
        return res.status(400).json({ error: "Job not found" });
      }

      const lineItem = await prisma.additionalCostLineItem.findFirst({
        where: {
          jobId: job.id,
          id: req.params.lineItemId,
          active: true,
        },
        include: {
          resourceType: {
            select: {
              title: true,
              id: true,
            },
          },
          resource: {
            select: {
              title: true,
              id: true,
            },
          },
          material: {
            select: {
              title: true,
              id: true,
            },
          },
        },
      });

      return res.json({ lineItem });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
];

export const put = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId, jobId } = req.params;
      const userId = req.user.id;

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId,
          shopId,
          active: true,
        },
      });

      if (!userShop) {
        return res
          .status(400)
          .json({ error: "You are not a member of this shop" });
      }

      const shouldLoadAll =
        req.user.admin ||
        userShop.accountType === "ADMIN" ||
        userShop.accountType === "OPERATOR";

      const job = await prisma.job.findFirst({
        where: {
          id: jobId,
          shopId,
          userId: shouldLoadAll ? undefined : userId,
        },
      });

      if (!job) {
        return res.status(400).json({ error: "Job not found" });
      }

      if (
        !(
          req.user.admin ||
          userShop.accountType === "ADMIN" ||
          userShop.accountType === "OPERATOR"
        )
      ) {
        return res.status(400).json({ error: "Unauthorized" });
      }

      const lineItem = await prisma.additionalCostLineItem.findFirst({
        where: {
          jobId: job.id,
          id: req.params.lineItemId,
          active: true,
        },
        include: {
          resourceType: {
            select: {
              title: true,
              id: true,
            },
          },
          resource: {
            select: {
              title: true,
              id: true,
            },
          },
          material: {
            select: {
              title: true,
              id: true,
            },
          },
        },
      });

      if (!lineItem) {
        return res.status(400).json({ error: "Line item not found" });
      }

      delete req.body.id;
      delete req.body.userId;
      delete req.body.shopId;
      delete req.body.createdAt;
      delete req.body.active;
      delete req.body.resourceType;
      delete req.body.resource;
      delete req.body.material;

      const validationResult = shopSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid data",
          issues: validationResult.error.format(),
        });
      }

      const validatedData = validationResult.data;

      const updatedLineItem = await prisma.additionalCostLineItem.update({
        where: {
          id: lineItem.id,
        },
        data: req.body,
      });

      return res.json({ lineItem: updatedLineItem });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
];

export const del = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId, jobId } = req.params;
      const userId = req.user.id;

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId,
          shopId,
          active: true,
        },
      });

      if (!userShop) {
        return res
          .status(400)
          .json({ error: "You are not a member of this shop" });
      }

      const shouldLoadAll =
        req.user.admin ||
        userShop.accountType === "ADMIN" ||
        userShop.accountType === "OPERATOR";

      const job = await prisma.job.findFirst({
        where: {
          id: jobId,
          shopId,
          userId: shouldLoadAll ? undefined : userId,
        },
      });

      if (!job) {
        return res.status(400).json({ error: "Job not found" });
      }

      const lineItem = await prisma.additionalCostLineItem.findFirst({
        where: {
          jobId: job.id,
          id: req.params.lineItemId,
          active: true,
        },
      });

      if (!lineItem) {
        return res.status(400).json({ error: "Line item not found" });
      }

      await prisma.additionalCostLineItem.update({
        where: {
          id: lineItem.id,
        },
        data: {
          active: false,
        },
      });

      return res.json({ success: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
];
