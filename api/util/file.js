// uploads.js — ESM, named exports, arrow funcs only

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import cuid from "cuid";
import multer from "multer";
import multerS3 from "multer-s3";
import dotenv from "dotenv";
dotenv.config();
import { prisma } from "#prisma";

/** ---------- S3 client ---------- */
export const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT,
});

/** ---------- Key + URL helpers ---------- */
// DO NOT encode here. Keys should contain raw characters (spaces are fine).
export const makeObjectKey = ({
  originalname,
  prefix = process.env.PROJECT_NAME,
}) => {
  if (!originalname) throw new Error("makeObjectKey: originalname required");
  return `${prefix}/${cuid()}_${originalname}`;
};

// Encode only for the URL path; preserve '/' separators.
const encodeKeyForUrl = (key) =>
  key.split("/").map(encodeURIComponent).join("/");

export const buildPublicUrl = ({ endpoint, bucket, region, key }) => {
  const cleanEndpoint = (endpoint || "").replace(/\/+$/g, "");
  const ensureHttps = (u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);
  const encodedKey = encodeKeyForUrl(key);

  // AWS-style host if no custom endpoint provided
  if (!cleanEndpoint || /amazonaws\.com$/i.test(cleanEndpoint)) {
    const r = region || "us-east-1";
    return `https://${bucket}.s3.${r}.amazonaws.com/${encodedKey}`;
  }
  return `${ensureHttps(cleanEndpoint)}/${bucket}/${encodedKey}`;
};

/** ---------- Multer storage (uses raw key) ---------- */
const multerStorage = multerS3({
  s3,
  bucket: process.env.AWS_BUCKET,
  key: (req, file, cb) => {
    try {
      cb(null, makeObjectKey({ originalname: file.originalname }));
    } catch (e) {
      cb(e);
    }
  },
  acl: "public-read",
});

export const rawUpload = multer({ storage: multerStorage });

export const upload =
  ({
    fieldName = "files",
    maxFileSize = 5 * 1024 * 1024,
    allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"],
  } = {}) =>
  (req, res, next) => {
    const dynamicUpload = multer({
      storage: multerStorage,
      limits: { fileSize: maxFileSize },
      fileFilter: (req, file, cb) => {
        if (
          allowedMimeTypes === "*" ||
          allowedMimeTypes.includes(file.mimetype)
        )
          cb(null, true);
        else
          cb(
            new Error(
              `Invalid file type. Allowed: ${allowedMimeTypes.join(", ")}`
            )
          );
      },
    });

    dynamicUpload.single(fieldName)(req, res, async (err) => {
      if (err)
        return res.status(400).json({ success: false, message: err.message });
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded." });

      try {
        const { originalname, mimetype, size, key, contentType } = req.file;

        const location = buildPublicUrl({
          endpoint: process.env.AWS_ENDPOINT,
          bucket: process.env.AWS_BUCKET,
          region: process.env.AWS_REGION,
          key,
        });

        const userId = req.user?.id || null;

        req.fileLog = await prisma.file.create({
          data: {
            userId,
            key, // raw key (contains spaces)
            originalname,
            mimetype,
            contentType: contentType || mimetype,
            size,
            location, // URL-encoded path
          },
        });

        next();
      } catch (error) {
        console.error("Error logging file upload:", error);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });
  };

/** ---------- Direct upload (same rule: raw key, encoded URL) ---------- */
export const uploadFile = async ({
  body,
  originalname,
  mimetype,
  contentType,
  size,
  userId = null,
  metadata = {},
  acl = "public-read",
  prefix = process.env.PROJECT_NAME,
}) => {
  if (!body) throw new Error("uploadFile: 'body' is required");
  if (!originalname) throw new Error("uploadFile: 'originalname' is required");

  const key = makeObjectKey({ originalname, prefix }); // raw (spaces allowed)
  const ContentType = contentType || mimetype || "application/octet-stream";

  const put = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: key,
    Body: body,
    ACL: acl,
    ContentType,
    Metadata: metadata,
  });

  const result = await s3.send(put);

  const location = buildPublicUrl({
    endpoint: process.env.AWS_ENDPOINT,
    bucket: process.env.AWS_BUCKET,
    region: process.env.AWS_REGION,
    key,
  });

  const inferredSize =
    typeof size === "number"
      ? size
      : Buffer.isBuffer(body) || body instanceof Uint8Array
      ? body.byteLength
      : null;

  const fileRecord = await prisma.file.create({
    data: {
      userId,
      key, // raw
      originalname,
      mimetype: mimetype || ContentType,
      contentType: ContentType,
      size: inferredSize,
      location, // encoded for URL
    },
  });

  return {
    key,
    location,
    etag: result.ETag,
    file: fileRecord,
  };
};
