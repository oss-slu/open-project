import { LogType } from "@prisma/client";
import { prisma } from "#prisma";
import { utapi } from "../config/uploadthing.js";
import { renderStl } from "./renderStl.js";
import NodeStl from "node-stl";

const logging = false;

export const handleUpload = async (data) => {
  // eslint-disable-next-line
  // return;
  const { jobId, shopId, userId, scope, resourceId, materialId, groupId } =
    data.metadata;

  console.log("FILE UPLOADED", data.file.name);

  if (scope === "job.fileupload") {
    logging && console.log("job.fileupload");
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        shopId,
      },
    });

    if (!job) {
      console.error("job not found");
      // return res.status(404).json({ error: "Not found" });
    }

    const jobItem = await prisma.jobItem.create({
      data: {
        jobId: job.id,

        fileKey: data.file.key,
        fileName: data.file.name,
        fileType: data.file.name.split(".").pop(),
        fileUrl: data.file.url,

        title: data.file.name,
      },
    });

    const fileType = data.file.name.split(".").pop();
    if (fileType === "stl") {
      console.log("STL");
      // Render stl
      const [pngData, stlData] = await renderStl(data.file.url);

      const upload = await utapi.uploadFiles([
        new File([pngData], `${data.file.name}.preview.png`, {
          type: "image/png",
        }),
      ]);

      const stlStats = new NodeStl(Buffer.from(stlData));
      console.log(stlStats);

      const newJobItem = await prisma.jobItem.update({
        where: {
          id: jobItem.id,
        },
        data: {
          fileThumbnailKey: upload[0].data.key,
          fileThumbnailName: upload[0].data.name,
          fileThumbnailUrl: upload[0].data.url,
          stlVolume: stlStats.volume,
          stlIsWatertight: stlStats.isWatertight,
          stlBoundingBoxX: stlStats.boundingBox[0] / 10,
          stlBoundingBoxY: stlStats.boundingBox[1] / 10,
          stlBoundingBoxZ: stlStats.boundingBox[2] / 10,
        },
      });
      console.log(newJobItem);
    }

    await prisma.logs.create({
      data: {
        userId: userId,
        shopId,
        jobId,
        jobItemId: jobItem.id,
        type: LogType.JOB_ITEM_CREATED,
      },
    });

    logging && console.log("jobItem", jobItem);
    // return res.sendStatus(200);
  }

  if (scope === "group.fileUpload") {
    logging && console.log("group.fileUpload");
    const group = await prisma.billingGroup.findFirst({
      where: {
        id: groupId,
        shopId,
      },
    });

    if (!group) {
      console.error("group not found");
      // return res.status(404).json({ error: "Not found" });
    }

    const jobItem = await prisma.jobItem.create({
      data: {
        jobId,

        fileKey: data.file.key,
        fileName: data.file.name,
        fileType: data.file.name.split(".").pop(),
        fileUrl: data.file.url,

        title: data.file.name,

        userId,
      },
    });

    const fileType = data.file.name.split(".").pop();
    if (fileType === "stl") {
      console.log("STL");
      // Render stl
      const [pngData, stlData] = await renderStl(data.file.url);

      const upload = await utapi.uploadFiles([
        new File([pngData], `${data.file.name}.preview.png`, {
          type: "image/png",
        }),
      ]);

      const stlStats = new NodeStl(Buffer.from(stlData));
      console.log(stlStats);

      const newJobItem = await prisma.jobItem.update({
        where: {
          id: jobItem.id,
        },
        data: {
          fileThumbnailKey: upload[0].data.key,
          fileThumbnailName: upload[0].data.name,
          fileThumbnailUrl: upload[0].data.url,
          stlVolume: stlStats.volume,
          stlIsWatertight: stlStats.isWatertight,
          stlBoundingBoxX: stlStats.boundingBox[0] / 10,
          stlBoundingBoxY: stlStats.boundingBox[1] / 10,
          stlBoundingBoxZ: stlStats.boundingBox[2] / 10,
        },
      });
      console.log(newJobItem);
    }

    await prisma.logs.create({
      data: {
        userId,
        shopId,
        jobId,
        jobItemId: jobItem.id,
        billingGroupId: group.id,
        type: LogType.JOB_ITEM_CREATED,
      },
    });

    // return res.sendStatus(200);
  }

  if (scope === "shop.resource.image") {
    logging && console.log("shop.resource.image");
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        shopId,
      },
    });

    if (!resource) {
      console.error("resource not found");
      // return res.status(404).json({ error: "Not found" });
    }

    const image = await prisma.resourceImage.create({
      data: {
        resourceId: resource.id,
        fileKey: data.file.key,
        fileName: data.file.name,
        fileType: data.file.name.split(".").pop(),
        fileUrl: data.file.url,
      },
    });

    await prisma.logs.create({
      data: {
        userId: userId,
        shopId,
        resourceId,
        resourceImageId: image.id,
        type: LogType.RESOURCE_IMAGE_CREATED,
      },
    });

    // return res.sendStatus(200);
  }

  if (scope === "material.msds") {
    logging && console.log("material.msds");
    const material = await prisma.material.findFirst({
      where: {
        id: materialId,
        shopId,
      },
    });

    if (!material) {
      console.error("material not found");
      // return res.status(404).json({ error: "Not found" });
    }

    await prisma.material.update({
      where: {
        id: material.id,
      },
      data: {
        msdsFileKey: data.file.key,
        msdsFileName: data.file.name,
        msdsFileType: data.file.name.split(".").pop(),
        msdsFileUrl: data.file.url,
      },
    });

    await prisma.logs.create({
      data: {
        userId: userId,
        shopId,
        materialId,
        resourceTypeId: material.resourceTypeId,
        type: LogType.MATERIAL_MSDS_UPLOADED,
      },
    });

    // return res.sendStatus(200);
  }

  if (scope === "material.tds") {
    logging && console.log("material.tds");
    const material = await prisma.material.findFirst({
      where: {
        id: materialId,
        shopId,
      },
    });

    if (!material) {
      console.error("material not found");
      // return res.status(404).json({ error: "Not found" });
    }

    await prisma.material.update({
      where: {
        id: material.id,
      },
      data: {
        tdsFileKey: data.file.key,
        tdsFileName: data.file.name,
        tdsFileType: data.file.name.split(".").pop(),
        tdsFileUrl: data.file.url,
      },
    });

    await prisma.logs.create({
      data: {
        userId: userId,
        shopId,
        materialId,
        resourceTypeId: material.resourceTypeId,
        type: LogType.MATERIAL_TDS_UPLOADED,
      },
    });

    // return res.sendStatus(200);
  }

  if (scope === "material.image") {
    logging && console.log("material.image");
    const material = await prisma.material.findFirst({
      where: {
        id: materialId,
        shopId,
      },
    });

    if (!material) {
      console.error("material not found");
      // return res.status(404).json({ error: "Not found" });
    }

    const image = await prisma.materialImage.create({
      data: {
        materialId: material.id,
        fileKey: data.file.key,
        fileName: data.file.name,
        fileType: data.file.name.split(".").pop(),
        fileUrl: data.file.url,
      },
    });

    await prisma.logs.create({
      data: {
        userId: userId,
        shopId,
        materialId,
        materialImageId: image.id,
        resourceTypeId: material.resourceTypeId,
        type: LogType.MATERIAL_IMAGE_CREATED,
      },
    });

    // return res.sendStatus(200);
  }

  if (scope === "shop.logo") {
    logging && console.log("shop.logo");
    const shop = await prisma.shop.findFirst({
      where: {
        id: shopId,
      },
    });

    if (!shop) {
      console.error("shop not found");
      // return res.status(404).json({
      //   error: "Not found",
      // });
    }

    if (shop.logoKey) {
      await utapi.deleteFiles([shop.logoKey]);
    }

    await prisma.shop.update({
      where: {
        id: shopId,
      },
      data: {
        logoKey: data.file.key,
        logoName: data.file.name,
        logoUrl: data.file.url,
      },
    });
  }

  // return res.status(404).json({ error: "Not found" });
};
