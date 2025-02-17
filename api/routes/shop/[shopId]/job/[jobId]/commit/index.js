import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
import { generateInvoice } from "../../../../../../util/docgen/invoice.js";
import { z } from "zod"

const shopSchema = z.object({
  finalized: z.boolean().optional,
  finalizedAt: z.date
});

export const post = [
  verifyAuth,
  async (req, res) => {
    const { shopId, jobId } = req.params;

    const userShop = await prisma.userShop.findFirst({
      where: {
        shopId: shopId,
        userId: req.user.id,
        active: true,
      },
    });

    if (!userShop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    if (
      !(
        userShop.accountType === "ADMIN" ||
        userShop.accountType === "OPERATOR" ||
        req.user.admin
      )
    ) {
      return res.status(400).json({ error: "Forbidden" });
    }

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        shopId: shopId,
      },
      include: {
        additionalCosts: {
          include: {
            material: true,
            resource: true,
          },
        },
        items: {
          include: {
            material: true,
            resource: true,
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.finalized) {
      return res.status(400).json({ error: "Job already finalized" });
    }

    const { url, key, value } = await generateInvoice(job);

    const validationResult = shopSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid data",
          issues: validationResult.error.format(),
        });
      }

      const validatedData = validationResult.data;

    await prisma.job.update({
      where: {
        id: jobId,
      },
      data: {
        finalized: validatedData.finalized,
        finalizedAt: validatedData.finalizedAt,
      },
      //
    });

    await prisma.ledgerItem.create({
      data: {
        shopId,
        jobId,
        userId: job.userId,
        invoiceUrl: url,
        invoiceKey: key,
        value: value,
      },
    });

    return res.status(200).json({ invoiceUrl: url });
  },
];
