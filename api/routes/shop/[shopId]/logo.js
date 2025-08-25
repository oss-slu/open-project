import prisma from "#prisma";
import { upload } from "#upload";
import { verifyAuth } from "#verifyAuth";

export const post = [
  verifyAuth,
  upload({
    // Image types
    allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg"],
    maxFileSize: 100 * 1024 * 1024, // 100 MB
  }),
  async (req, res) => {
    try {
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

      if (userShop.accountType !== "ADMIN" && !req.user.admin) {
        return res.status(400).json({ message: "Unauthorized" });
      }

      const newShop = await prisma.shop.update({
        where: {
          id: shopId,
        },
        data: {
          logoFile: {
            connect: {
              id: req.fileLog.id,
            },
          },
        },
      });

      console.log(newShop);

      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
];
