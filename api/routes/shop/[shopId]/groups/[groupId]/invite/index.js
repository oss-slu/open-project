import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { LogType } from "@prisma/client";
import { z } from "zod"

const logsSchema  = z.object({
  billingGroupId: z.string().optional()
});


export const get = [
  verifyAuth,
  async (req, res) => {
    const userId = req.user.id;
    const { shopId, groupId } = req.params;

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

    const userGroup = await prisma.userBillingGroup.findFirst({
      where: {
        userId,
        billingGroupId: groupId,
        active: true,
      },
    });

    const userIsPrivileged =
      req.user.admin ||
      userShop.accountType === "ADMIN" ||
      userShop.accountType === "OPERATOR" ||
      userGroup.role === "ADMIN";

    if (!userIsPrivileged) {
      return res.status(400).send({ error: "Forbidden" });
    }

    const invites = await prisma.billingGroupInvitationLink.findMany({
      where: {
        billingGroupId: groupId,
      },
    });

    res.json({ invites });
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    const userId = req.user.id;
    const { shopId, groupId } = req.params;
    let { expires } = req.body;
    expires = expires ? new Date(expires) : undefined;

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

    const userGroup = await prisma.userBillingGroup.findFirst({
      where: {
        userId,
        billingGroupId: groupId,
        active: true,
      },
    });

    if (!userGroup) {
      return res.status(400).send({ error: "Forbidden" });
    }

    const userIsPrivileged =
      req.user.admin ||
      userShop.accountType === "ADMIN" ||
      userShop.accountType === "OPERATOR" ||
      userGroup.role === "ADMIN";

    if (!userIsPrivileged) {
      return res.status(400).send({ error: "Forbidden" });
    }

    const validationResult = logsSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid data",
          issues: validationResult.error.format(),
        });
      }

      const validatedData = validationResult.data;

    const invite = await prisma.billingGroupInvitationLink.create({
      data: {
        billingGroupId: validatedData.billingGroupId,
        expires,
      },
    });

    await prisma.logs.create({
      data: {
        type: LogType.BILLING_GROUP_INVITATION_LINK_CREATED,
        userId: req.user.id,
        billingGroupInvitationLinkId: invite.id,
        shopId,
        billingGroupId: groupId,
      },
    });

    const invitations = await prisma.billingGroupInvitationLink.findMany({
      where: {
        billingGroupId: groupId,
      },
    });

    res.json({ invites: invitations });
  },
];
