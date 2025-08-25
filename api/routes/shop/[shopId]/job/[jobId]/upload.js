import { verifyAuth } from "#verifyAuth";
import { upload } from "#upload";
import { uploadFileToJob } from "../../../../../util/uploadFileToJob.js";

export const post = [
  verifyAuth,
  upload({
    allowedMimeTypes: "*",
    maxFileSize: 100 * 1024 * 1024, // 100 MB
  }),
  async (req, res) => {
    try {
      await uploadFileToJob({
        jobId: req.params.jobId,
        shopId: req.params.shopId,
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
