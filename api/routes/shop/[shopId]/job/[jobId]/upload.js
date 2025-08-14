import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { upload, uploadFile } from "#upload";
import { renderStl } from "../../../../../util/renderStl.js";
import NodeStl from "node-stl";
import { LogType } from "@prisma/client";
import fs from "fs";

const logging = true;

export const post = [
  verifyAuth,
  upload({
    allowedMimeTypes: "*",
    maxFileSize: 100 * 1024 * 1024, // 100 MB
  }),
  async (req, res) => {
    logging && console.log("job.fileupload");
    const { jobId, shopId } = req.params;
    const userId = req.user.id;

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        shopId,
      },
    });

    if (!job) {
      console.error("job not found");
      return res.status(404).json({ error: "Not found" });
    }

    const jobItem = await prisma.jobItem.create({
      data: {
        jobId: job.id,

        // fileKey: req.file.key,
        // fileName: req.file.name,
        fileType: req.file.originalname.split(".").pop(),
        fileUrl: req.file.location?.includes("https://")
          ? req.file.location
          : "https://" + req.file.location,

        fileId: req.fileLog.id,

        title: req.file.originalname || "No Name",
      },
    });

    const fileType = req.file.originalname?.split(".")?.pop();
    if (fileType === "stl") {
      console.log("Rendering STL");
      // Render stl
      const [pngData, stlData] = await renderStl(req.file.location);
      console.log("Png rendered");

      console.log(pngData);
      fs.writeFileSync("png.png", pngData);

      const upload = await uploadFile({
        body: Buffer.isBuffer(pngData) ? pngData : Buffer.from(pngData),
        originalname: req.file.originalname + ".preview.png",
        mimetype: "image/png",
        contentType: "application/octet-stream",
      });

      console.log("up", upload);

      const stlStats = new NodeStl(Buffer.from(stlData));
      console.log(stlStats);

      const newJobItem = await prisma.jobItem.update({
        where: {
          id: jobItem.id,
        },
        data: {
          // fileThumbnailKey: upload[0].data.key,
          // fileThumbnailName: upload[0].data.name,
          // fileThumbnailUrl: upload[0].data.url,
          thumbnailFileId: upload.file.id,

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
    return res.sendStatus(200);
  },
];
