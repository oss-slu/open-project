import { prisma } from "#prisma";
import { verifyAuth, verifyAuthAlone } from "#verifyAuth";
import { LogType } from "@prisma/client";
import { z } from "zod";

const shopSchema = z.object({
  title: z.string().min(1, "Title is Required"),
  description: z.string().optional,
  // membersCanCreateJobs: z.bool().???(????)
});

export const put = [
  verifyAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { shopId, groupId } = req.params;

      if (!shopId) {
        return res.status(400).send({ error: "Shop ID is required" });
      }

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId,
          shopId,
          active: true,
        },
      });

      if (!userShop) {
        return res.status(400).send({ error: "Forbidden" });
      }

      const userIsPrivileged =
        req.user.admin ||
        userShop.accountType === "ADMIN" ||
        userShop.accountType === "OPERATOR" ||
        userShop.accountType === "GROUP_ADMIN";

      if (!userIsPrivileged) {
        return res.status(400).send({ error: "Forbidden" });
      }

      const originalGroup = await prisma.billingGroup.findFirst({
        where: {
          id: groupId,
        },
      });

      const validationResult = shopSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid data",
          issues: validationResult.error.format(),
        });
      }

      const validatedData = validationResult.data;

      const group = await prisma.billingGroup.update({
        where: {
          id: groupId,
        },
        data: {
          title: validatedData.title,
          description: validatedData.description,
          membersCanCreateJobs: validatedData.membersCanCreateJobs,
        },
        // select: GROUP?
      });

      await prisma.logs.create({
        data: {
          userId,
          shopId,
          billingGroupId: group.id,
          type: LogType.BILLING_GROUP_MODIFIED,
          from: JSON.stringify({ group: originalGroup }),
          to: JSON.stringify({ group }),
        },
      });

      res.json({ group });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  },
];

export const get = [
  async (req, res) => {
    try {
      const user = await verifyAuthAlone(req.headers.authorization);
      const { shopId, groupId } = req.params;

      if (!shopId) {
        return res.status(400).send({ error: "Shop ID is required" });
      }

      if (!groupId) {
        return res.status(400).send({ error: "Group ID is required" });
      }

      let userIsPrivileged = false;
      if (user) {
        const userShop = await prisma.userShop.findFirst({
          where: {
            userId: user.id,
            shopId,
            active: true,
          },
        });

        if (userShop) {
          userIsPrivileged =
            user.admin ||
            userShop.accountType === "ADMIN" ||
            userShop.accountType === "OPERATOR" ||
            userShop.accountType === "GROUP_ADMIN";
        }
      }

      const group = await prisma.billingGroup.findFirst({
        where: {
          id: groupId,
          shopId,
          users: userIsPrivileged
            ? undefined
            : {
                some: {
                  user: { id: user.id },
                },
              },
        },
        include: {
          users: {
            where: {
              role: userIsPrivileged ? undefined : "ADMIN",
              active: true,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              role: true,
              createdAt: true,
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  id: true,
                  createdAt: true,
                },
              },
            },
          },
          _count: {
            select: {
              users: {
                where: {
                  active: true,
                },
              },
            },
          },
          jobs: {
            // Count all items that have `approved` at null in each job
            include: {
              items: {
                select: {
                  approved: true,
                },
                where: {
                  active: true,
                },
              },
            },
          },
        },
      });

      if (group.jobs) {
        group.jobs = group.jobs.map((job) => {
          job.unapprovedItems = job.items.filter(
            (item) => item.approved === null
          ).length;
          job.totalItems = job.items.length;
          job.approvedItems = job.items.filter(
            (item) => item.approved === true
          ).length;
          job.rejectedItems = job.items.filter(
            (item) => item.approved === false
          ).length;
          delete job.items;
          return job;
        });
      }

      const adminUsers = group.users.filter((user) => user.role === "ADMIN");
      group.userCount = group._count.users;
      group.adminUsers = adminUsers.map((user) => ({
        name: user.user.firstName + " " + user.user.lastName,
        id: user.user.id,
      }));

      group._count = undefined;

      group.userIsMember = false;
      group.userRole = null;
      if (user) {
        const userBillingGroup = await prisma.userBillingGroup.findFirst({
          where: {
            userId: user.id,
            billingGroupId: groupId,
            active: true,
          },
        });

        if (userBillingGroup) {
          group.userIsMember = true;
          group.userRole = userBillingGroup.role;
        }
      }

      res.json({ group });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  },
];

/*
export const merge = [
  verifyAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { shopId, groupId } = req.params;
      const { targetUserId } = req.query;

      if (!shopId) {
        return res.status(400).send({ error: "Shop ID is required" });
      }
      if (!groupId) {
        return res.status(400).send({ error: "Group ID is required" });
      }
      if (!targetUserId) {
        return res.status(400).send({ error: "Target user ID is required" });
      }

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId,
          shopId,
          active: true,
        },
      });

      if (!userShop) {
        return res.status(400).send({ error: "Forbidden" });
      }

      const userIsPrivileged =
        req.user.admin ||
        userShop.accountType === "ADMIN" ||
        userShop.accountType === "OPERATOR" ||
        userShop.accountType === "GROUP_ADMIN";

      if (!userIsPrivileged) {
        return res.status(400).send({ error: "Forbidden" });
      }

      let targetUserShop = await prisma.userShop.findFirst({
        where: {
          userId: targetUserId,
          shopId,
          active: true,
        },
      });

      if (!targetUserShop) {
        // Add user to shop
        targetUserShop = await prisma.userShop.create({
          data: {
            userId: targetUserId,
            shopId,
            accountType: "CUSTOMER",
          },
        });
      }

      const billingGroup = await prisma.userBillingGroup.findFirst({
        where: {
          userId: targetUserId,
          billingGroupId: groupId,
        },
      });

      if (billingGroup) {
        if (billingGroup.active) {
          return res.status(400).send({ error: "User is already in group" });
        }

        await prisma.userBillingGroup.update({
          where: {
            id: billingGroup.id,
          },
          data: {
            active: true,
          },
        });
      } else {
        await prisma.userBillingGroup.create({
          data: {
            userId: targetUserId,
            billingGroupId: groupId,
            role: "MEMBER",
          },
        });
      }

      await prisma.logs.create({
        data: {
          userId,
          shopId,
          billingGroupId: groupId,
          type: LogType.USER_ADDED_TO_BILLING_GROUP,
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  },
];

export const purge = [
  verifyAuth,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { shopId, groupId } = req.params;
      const { targetUserId } = req.query;

      if (!shopId) {
        return res.status(400).send({ error: "Shop ID is required" });
      }
      if (!groupId) {
        return res.status(400).send({ error: "Group ID is required" });
      }
      if (!targetUserId) {
        return res.status(400).send({ error: "Target user ID is required" });
      }

      const userShop = await prisma.userShop.findFirst({
        where: {
          userId,
          shopId,
          active: true,
        },
      });

      if (!userShop) {
        return res.status(400).send({ error: "Forbidden" });
      }

      const userIsPrivileged =
        req.user.admin ||
        userShop.accountType === "ADMIN" ||
        userShop.accountType === "OPERATOR" ||
        userShop.accountType === "GROUP_ADMIN";

      if (!userIsPrivileged) {
        return res.status(400).send({ error: "Forbidden" });
      }

      const billingGroup = await prisma.userBillingGroup.findFirst({
        where: {
          userId: targetUserId,
          billingGroupId: groupId,
        },
      });

      if (!billingGroup) {
        return res.status(400).send({ error: "User is not in group" });
      }

      await prisma.userBillingGroup.update({
        where: {
          id: billingGroup.id,
        },
        data: {
          active: false,
        },
      });

      await prisma.logs.create({
        data: {
          userId,
          shopId,
          billingGroupId: groupId,
          type: LogType.USER_REMOVED_FROM_BILLING_GROUP,
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Internal server error" });
    }
  },
];
*/
