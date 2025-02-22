import { createUploadthing } from "uploadthing/express";
import { verifyAuthAlone } from "../util/verifyAuth.js";
import { prisma } from "../util/prisma.js";
import { UploadThingError } from "uploadthing/server";
import { UTApi } from "uploadthing/server";
import { handleUpload } from "../util/upload.js";

export const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

const f = createUploadthing({
  errorFormatter: (err) => {
    console.error(err);
    return {
      message: err.message,
    };
  },
});

export const uploadRouter = {
  files: f({
    blob: {
      maxFileSize: "128MB",
      maxFileCount: 150,
    },
  })
    .middleware(async ({ req }) => {
      let user = null;

      try {
        user = await verifyAuthAlone(req.headers.authorization);
      } catch (error) {
        console.log(error);
        throw new UploadThingError("You must be logged in to upload files");
      }

      const scope = req.headers["x-scope"];
      const metadata = JSON.parse(req.headers["x-metadata"]);

      if (!req.headers["x-scope"]) {
        throw new UploadThingError("Missing x-scope header");
      }

      if (!req.headers["x-metadata"]) {
        throw new UploadThingError("Missing x-metadata header");
      }

      if (!user) {
        throw new UploadThingError("You must be logged in to upload files");
      }

      if (user.suspended) {
        throw new UploadThingError("Your account has been suspended");
      }

      if (scope === "job.fileupload") {
        const { shopId, jobId } = JSON.parse(req.headers["x-metadata"]);

        if (user.admin) {
          return { ...metadata, userId: user.id, scope };
        }

        const userShop = await prisma.userShop.findFirst({
          where: {
            userId: user.id,
            shopId,
          },
        });

        if (!userShop) {
          throw new UploadThingError("You do not have access to this shop");
        }

        if (userShop.accountType === "CUSTOMER") {
          const job = await prisma.job.findFirst({
            where: {
              id: jobId,
              shopId,
              userId: user.id,
            },
          });
          if (!job) {
            throw new UploadThingError("You do not have access to this job");
          }
        }
        return { ...metadata, userId: user.id, scope };
      }

      if (scope === "group.fileUpload") {
        const { groupId, jobId } = metadata;

        if (user.admin) {
          return { ...metadata, userId: user.id, scope };
        }

        const userGroup = await prisma.userBillingGroup.findFirst({
          where: {
            userId: user.id,
            billingGroupId: groupId,
            active: true,
          },
        });

        if (!userGroup) {
          throw new UploadThingError("You do not have access to this group");
        }

        const job = await prisma.job.findFirst({
          where: {
            id: jobId,
            groupId,
          },
        });

        if (!job) {
          throw new UploadThingError("Job not found");
        }

        return { ...metadata, userId: user.id, scope };
      }

      if (scope === "shop.resource.image") {
        const { shopId, resourceId } = metadata;

        if (user.admin) {
          return { ...metadata, userId: user.id, scope };
        }

        const resource = await prisma.resource.findFirst({
          where: {
            id: resourceId,
            shopId,
          },
        });

        if (!resource) {
          throw new UploadThingError("Resource not found");
        }

        const userShop = await prisma.userShop.findFirst({
          where: {
            userId: user.id,
            shopId,
          },
        });

        if (!userShop) {
          throw new UploadThingError("You do not have access to this shop");
        }

        if (userShop.accountType === "ADMIN") {
          return { ...metadata, userId: user.id, scope };
        }
      }

      if (
        scope === "material.msds" ||
        scope === "material.tds" ||
        scope === "material.image"
      ) {
        const { materialId } = metadata;

        const material = await prisma.material.findFirst({
          where: {
            id: materialId,
          },
        });

        if (!material) {
          throw new UploadThingError("Material not found");
        }

        if (user.admin) {
          return { ...metadata, userId: user.id, scope };
        }

        const userShop = await prisma.userShop.findFirst({
          where: {
            userId: user.id,
            shopId: material.shopId,
          },
        });

        if (!userShop) {
          throw new UploadThingError("You do not have access to this shop");
        }

        if (userShop.accountType === "ADMIN") {
          return { ...metadata, userId: user.id, scope };
        }
      }

      if (scope === "shop.logo") {
        const { shopId } = metadata;

        if (user.admin) {
          return { ...metadata, userId: user.id, scope };
        }

        const userShop = await prisma.userShop.findFirst({
          where: {
            userId: user.id,
            shopId,
          },
        });

        if (!userShop) {
          throw new UploadThingError("You do not have access to this shop");
        }

        if (userShop.accountType === "ADMIN") {
          return { ...metadata, userId: user.id, scope };
        }
      }
    })
    .onUploadComplete((data) => {
      handleUpload(data);
    }),
};
