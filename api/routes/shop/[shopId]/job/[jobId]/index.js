// eslint-disable-next-line no-unused-vars
import { LedgerItemType, LogType, Prisma } from "@prisma/client";
import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { generateInvoice } from "../../../../../util/docgen/invoice.js";
import { z } from "zod";

const userSchema = z.object({
  ledgerItemId: z.string().optional
});

/** @type {Prisma.JobInclude} */
const JOB_INCLUDE = {
  items: {
    where: {
      active: true,
    },
    include: {
      resource: {
        select: {
          costingPublic: true,
          costPerProcessingTime: true,
          costPerTime: true,
          costPerUnit: true,
          title: true,
        },
      },
      material: {
        select: {
          costPerUnit: true,
          unitDescriptor: true,
          title: true,
        },
      },
      secondaryMaterial: {
        select: {
          costPerUnit: true,
          unitDescriptor: true,
          title: true,
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          id: true,
        },
      },
    },
  },
  resource: {
    select: {
      id: true,
      title: true,
    },
  },
  additionalCosts: {
    where: {
      active: true,
    },
    include: {
      resource: {
        select: {
          costPerProcessingTime: true,
          costPerTime: true,
          costPerUnit: true,
        },
      },
      material: {
        select: {
          costPerUnit: true,
        },
      },
      secondaryMaterial: {
        select: {
          costPerUnit: true,
        },
      },
    },
  },
  ledgerItems: {
    where: {
      type: LedgerItemType.JOB,
    },
  },
  group: {
    select: {
      id: true,
      title: true,
      active: true,
      users: {
        where: {
          active: true,
          role: "ADMIN",
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  },
};

/** @type {Prisma.JobInclude} */
const generateGroupInclude = (userId, userIsPrivileged) => {
  /** @type {Prisma.JobInclude} */
  const JOB_GROUP_INCLUDE = JSON.parse(JSON.stringify(JOB_INCLUDE));
  JOB_GROUP_INCLUDE.items.where = {
    active: true,
    userId,
  };
  if (!userIsPrivileged) {
    JOB_GROUP_INCLUDE.additionalCosts = undefined;
    JOB_GROUP_INCLUDE.ledgerItems = undefined;
    JOB_GROUP_INCLUDE.resource = undefined;
  }
  return JOB_GROUP_INCLUDE;
};

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

      const initialJob = await prisma.job.findFirst({
        where: {
          id: jobId,
          shopId,
        },
      });

      let job;
      if (initialJob.groupId && !shouldLoadAll) {
        const INCLUDE = generateGroupInclude(userId);

        // The job is part of a group, so we need to handle different users accessing it.

        // Make sure the user is in the group
        const userGroup = await prisma.userBillingGroup.findFirst({
          where: {
            userId,
            billingGroupId: initialJob.groupId,
            active: true,
          },
        });

        if (!userGroup) {
          return res
            .status(400)
            .json({ error: "You are not a member of this group" });
        }

        job = await prisma.job.findFirst({
          where: {
            id: jobId,
            shopId,
          },
          include: INCLUDE,
        });
      } else {
        job = await prisma.job.findFirst({
          where: {
            id: jobId,
            shopId,
            userId: shouldLoadAll ? undefined : userId,
          },
          include: JOB_INCLUDE,
        });
      }

      // TODO: Respect costing public

      if (!job) {
        return res.status(404).json({ error: "Not found" });
      }

      return res.json({ job });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "An error occurred" });
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
        return res.status(400).json({ error: "Forbidden" });
      }

      let job;

      const shouldLoadAll =
        req.user.admin ||
        userShop.accountType === "ADMIN" ||
        userShop.accountType === "OPERATOR";

      job = await prisma.job.findFirst({
        where: {
          id: jobId,
          userId: shouldLoadAll ? undefined : userId,
        },
        include: {
          additionalCosts: {
            include: {
              material: true,
              secondaryMaterial: true,
              resource: true,
            },
          },
          items: {
            include: {
              material: true,
              secondaryMaterial: true,
              resource: true,
            },
          },
        },
      });

      if (!job) {
        return res.status(404).json({ error: "Not found" });
      }

      delete req.body.id;
      delete req.body.userId;
      delete req.body.shopId;
      delete req.body.createdAt;
      delete req.body.updatedAt;
      delete req.body.items;
      delete req.body.resource;

      let updatedJob;
      if (req.body.finalized && !job.finalized) {
        if (
          !(
            userShop.accountType === "ADMIN" ||
            userShop.accountType === "OPERATOR" ||
            req.user.admin
          )
        ) {
          return res.status(400).json({ error: "Forbidden" });
        }

        console.log("Generating Invoice");
        const { url, key, value, log } = await generateInvoice(
          job,
          userId,
          shopId
        );
        console.log("Generated Invoice", url);
        await prisma.job.update({
          where: {
            id: jobId,
          },
          data: {
            finalized: true,
            finalizedAt: new Date(),
          },
        });

        const ledgerItem = await prisma.ledgerItem.create({
          data: {
            shopId,
            jobId,
            userId: job.userId,
            invoiceUrl: url,
            invoiceKey: key,
            value: value * -1,
            type: LedgerItemType.JOB,
          },
        });

        const validationResult = userSchema.safeParse(req.body);
          if (!validationResult.success) {
            return res.status(400).json({
          error: "Invalid data",
          issues: validationResult.error.format(),
          });
        }

        const validatedData = validationResult.data;

        await prisma.logs.update({
          where: {
            id: log.id,
          },
          data: {
            ledgerItemId: validatedData.ledgerItem,
          }
        });

        await prisma.logs.createMany({
          data: [
            {
              userId: req.user.id,
              shopId,
              jobId,
              type: LogType.JOB_FINALIZED,
              ledgerItemId: ledgerItem.id,
            },
            {
              userId: req.user.id,
              shopId,
              jobId,
              type: LogType.LEDGER_ITEM_CREATED,
              ledgerItemId: ledgerItem.id,
            },
          ],
        });

        // Finalize job
      } else {
        updatedJob = await prisma.job.update({
          where: {
            id: jobId,
          },
          data: req.body,
          include: JOB_INCLUDE,
        });

        await prisma.logs.create({
          data: {
            type: LogType.JOB_MODIFIED,
            userId,
            shopId,
            jobId,
            from: JSON.stringify(job),
            to: JSON.stringify(updatedJob),
          },
        });
      }

      return res.json({ job: updatedJob });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "An error occurred" });
    }
  },
];
