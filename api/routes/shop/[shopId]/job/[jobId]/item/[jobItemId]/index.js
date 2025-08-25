import { LogType } from "@prisma/client";
import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { utapi } from "../../../../../../../config/uploadthing.js";
import { z } from "zod";

const jobSchema = z.object({
  costingPublic: z.boolean().optional(),
  costPerProcessingTime: z.number().optional(),
  costPerTime: z.number().optional(),
  costPerUnit: z.number().optional(),
  unitDescriptor: z.string().optional(),
});

export const get = [
  verifyAuth,
  async (req, res) => {
    try {
      const { shopId, jobId, jobItemId } = req.params;
      const userId = req.user.id;

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId,
          shopId,
          active: true,
        },
      });

      if (!userShop) {
        return res.status(404).json({ error: "Not found" });
      }

      const item = await prisma.jobItem.findFirst({
        where: {
          id: jobItemId,
          jobId,
        },
      });

      if (!item) {
        return res.status(404).json({ error: "Not found" });
      }

      return res.json({ item });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "An error occurred" });
    }
  },
];

export const put = [
  verifyAuth,
  async (req, res) => {
    const { shopId, jobId, jobItemId } = req.params;
    const userId = req.user.id;

    const userShop = await prisma.userShop.findFirst({
      where: {
        userId,
        shopId,
        active: true,
      },
    });

    if (!userShop) {
      return res.status(400).json({ error: "User shop not found" });
    }

    let firstJob = await prisma.job.findFirst({
      where: {
        id: jobId,
        shopId,
      },
    });

    let job;
    if (
      userShop.accountType === "CUSTOMER" &&
      !req.user.admin &&
      !firstJob.groupId
    ) {
      job = await prisma.job.findFirst({
        where: {
          id: jobId,
          shopId,
          userId,
        },
      });
    } else {
      job = await prisma.job.findFirst({
        where: {
          id: jobId,
          shopId,
        },
      });
    }

    if (!job) {
      return res.status(404).json({ error: "Not found" });
    }

    const jobItem = await prisma.jobItem.findFirst({
      where: {
        id: jobItemId,
        jobId,
        active: true,
      },
    });

    if (!jobItem) {
      return res.status(404).json({ error: "Not found" });
    }

    if (
      (req.body.data.resourceTypeId || req.body.data.resourceTypeId === null) &&
      req.body.data.resourceTypeId !== jobItem.resourceTypeId
    ) {
      req.body.data.materialId = null;
      req.body.data.secondaryMaterialId = null;
      req.body.data.resourceId = null;
    }

    delete req.body.data.resource;
    delete req.body.data.resourceType;
    delete req.body.data.material;
    delete req.body.data.secondaryMaterial;

    console.log(req.body.data);

    const validationResult = jobSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid data",
        issues: validationResult.error.format(),
      });
    }

    const updatedItem = await prisma.jobItem.update({
      where: {
        id: jobItemId,
        active: true,
      },
      data: req.body.data,
      include: {
        resource: {
          select: {
            id: true,
            title: true,
            costingPublic: true,
            costPerProcessingTime: true,
            costPerTime: true,
            costPerUnit: true,
          },
        },
        material: {
          select: {
            costPerUnit: true,
            unitDescriptor: true,
          },
        },
        secondaryMaterial: {
          select: {
            costPerUnit: true,
            unitDescriptor: true,
          },
        },
      },
    });

    const updatedItemToLog = JSON.parse(JSON.stringify(updatedItem));
    delete updatedItemToLog.resource;
    delete updatedItemToLog.material;
    //delete updatedItemToLog.secondaryMaterial;  MIGHT NEED TO UPDATE LOGS TABLE...

    await prisma.logs.create({
      data: {
        userId,
        shopId,
        jobId,
        jobItemId,
        type: LogType.JOB_ITEM_MODIFIED,
        from: JSON.stringify(jobItem),
        to: JSON.stringify(updatedItemToLog),
      },
    });

    return res.json({ item: updatedItem });
  },
];

export const del = [
  verifyAuth,
  async (req, res) => {
    const { shopId, jobId, jobItemId } = req.params;
    const userId = req.user.id;

    const userShop = await prisma.userShop.findFirst({
      where: {
        userId,
        shopId,
        active: true,
      },
    });

    if (!userShop) {
      return res.status(404).json({ error: "Not found" });
    }

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        shopId,
      },
    });

    if (!job) {
      return res.status(404).json({ error: "Not found" });
    }

    const jobItem = await prisma.jobItem.update({
      where: {
        id: jobItemId,
      },
      data: {
        active: false,
      },
    });

    await utapi.deleteFiles(
      [jobItem.fileKey, jobItem.fileThumbnailKey].filter(Boolean)
    );

    await prisma.logs.create({
      data: {
        userId,
        shopId,
        jobId,
        jobItemId,
        type: LogType.JOB_ITEM_DELETED,
      },
    });

    return res.json({ success: true });
  },
];
