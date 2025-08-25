import prisma from "#prisma";
import { upload } from "#upload";
import { verifyAuth } from "#verifyAuth";
import { uploadFileToJob } from "../../../../../util/uploadFileToJob.js";

export const get = [
  verifyAuth,
  upload({
    allowedMimeTypes: "*",
    maxFileSize: 100 * 1024 * 1024, // 100 MB
  }),
  async (req, res) => {
    try {
      const { shopId, groupId } = req.params;
      const { jobId } = req.query;
      const userId = req.user.id;

      const group = await prisma.billingGroup.findFirst({
        where: {
          id: groupId,
          shopId,
          users: {
            some: {
              userId,
              active: true,
            },
          },
        },
      });

      if (!group) {
        return res.status(404).json({ error: "Not found" });
      }

      await uploadFileToJob({
        jobId,
        shopId,
        groupId,
        userId: req.user.id,
        file: {
          originalname: req.file.originalname,
          location: req.file.location,
          logId: req.fileLog.id,
        },
        logging: true,
      });

      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
];
