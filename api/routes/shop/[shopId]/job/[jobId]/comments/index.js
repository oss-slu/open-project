import { prisma } from "#prisma";
import { verifyAuth } from "#verifyAuth";
// import client from "#postmark";

export const get = [
  verifyAuth,
  async (req, res) => {
    const { shopId, jobId } = req.params;
    const userShop = await prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId,
        active: true,
      },
    });

    if (!userShop) {
      return res.status(400).json({ message: "Shop not found" });
    }

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        shopId,
      },
    });

    if (!job) {
      return res.status(400).json({ message: "Job not found" });
    }

    const comments = await prisma.jobComment.findMany({
      where: {
        jobId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shops: {
              where: {
                shopId: shopId,
              },
              select: {
                accountTitle: true,
                accountType: true,
              },
            },
          },
        },
      },
    });

    res.json({ comments });
  },
];

export const post = [
  verifyAuth,
  async (req, res) => {
    const { shopId, jobId } = req.params;
    const userShop = await prisma.userShop.findFirst({
      where: {
        userId: req.user.id,
        shopId,
        active: true,
      },
    });

    if (!userShop) {
      return res.status(400).json({ message: "Shop not found" });
    }

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        shopId,
      },
    });

    if (!job) {
      return res.status(400).json({ message: "Job not found" });
    }

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    await prisma.jobComment.create({
      data: {
        message: message,
        userId: req.user.id,
        jobId,
      },
    });

    console.log("Email Sent! - mock");

    /* - When you uncomment this don't forget to remove the comment for importing postmark!!!

    const { name: shopName } = await prisma.shop.findFirst({
        where: {
          id: shopId,
        }
      });

    const operators = await prisma.userShop.findMany({
      where: {
        shopId: shopId,
        accountType: 'OPERATOR',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
    
    let emails = [];
    for (const operator of operators) {
      const jobLog = await prisma.logs.findFirst({
        where: {
          shopId: shopId,
          userId: operator.user.id,
          jobId: jobId,
        }
      });

      jobLog && emails.push(operator.user.email);
    }

    if (!emails.includes(req.user.email)) {
      emails.push(req.user.email);
    }

    client.sendEmail({
      "From": `${process.env.POSTMARK_FROM_EMAIL}`, 
      "To": `${emails.join(',')}`,
      "Subject": `Comment created on job ${job.title} and shop ${shopName}`,
      "HtmlBody": `The comment "${message}" was created on the job ${job.title} and shop ${shopName}`, 
      "TextBody": `The comment "${message}" was created on the job ${job.title} and shop ${shopName}`,
      "MessageStream": "outbound"
    }); 

    */

    const comments = await prisma.jobComment.findMany({
      where: {
        jobId,
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
    });

    res.json({ comments });
  },
];
