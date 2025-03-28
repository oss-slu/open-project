import { LogType } from "@prisma/client";
import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";

// Promote a user to global admin
export const post = [
  verifyAuth,
  async (req, res) => {
    try {
      if (!req.user.admin) {
        res.status(403).json({
          error: "Unauthorized",
        });
        return;
      }

      let user = await prisma.user.findUnique({
        where: {
          id: req.params.userId,
        },
      });

      if (!user) {
        res.status(404).json({
          message: "User not found",
        });
        return;
      }

      if (user.admin) {
        res.status(400).json({
          message: "User is already an admin",
        });
        return;
      }

      await prisma.user.update({
        where: {
          id: req.params.userId,
        },
        data: {
          admin: true,
        },
      });

      await prisma.logs.create({
        data: {
          userId: req.params.userId,
          type: LogType.USER_PROMOTED_TO_ADMIN,
          message: `User ${req.params.userId} was promoted to admin by ${req.user.id}`,
        },
      });

      res.json({
        message: "User is now an admin",
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        error: "Internal Server Error",
      });
    }
  },
];

export const del = [
  verifyAuth,
  async (req, res) => {
    if (!req.user.admin) {
      res.status(403).json({
        error: "Unauthorized",
      });
      return;
    }

    let user = await prisma.user.findUnique({
      where: {
        id: req.params.userId,
      },
    });

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    if (!user.admin) {
      res.status(400).json({
        message: "User is not an admin",
      });
      return;
    }

    await prisma.user.update({
      where: {
        id: req.params.userId,
      },
      data: {
        admin: false,
      },
    });

    await prisma.logs.create({
      data: {
        userId: req.params.userId,
        type: LogType.USER_DEMOTED_FROM_ADMIN,
      },
    });

    res.json({
      message: "User is no longer an admin",
    });
  },
];
