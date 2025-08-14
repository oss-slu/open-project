import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import cuid from "cuid";
import multer from "multer";
import multerS3 from "multer-s3";
import dotenv from "dotenv";
dotenv.config();
import { prisma } from "#prisma";

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT,
});

export const rawUpload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET,
    key: (req, file, cb) => {
      cb(
        null,
        `${process.env.PROJECT_NAME}/${cuid()}_${encodeURIComponent(
          file.originalname
        )}`
      );
    },
    acl: "public-read",
  }),
});

export const upload =
  ({
    fieldName = "files",
    maxFileSize = 5 * 1024 * 1024, // Default 5MB
    allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"],
  } = {}) =>
  (req, res, next) => {
    const dynamicUpload = multer({
      storage: multerS3({
        s3,
        bucket: process.env.AWS_BUCKET,
        key: (req, file, cb) => {
          cb(
            null,
            `${process.env.PROJECT_NAME}/${cuid()}_${encodeURIComponent(
              file.originalname
            )}`
          );
        },
        acl: "public-read",
      }),
      limits: { fileSize: maxFileSize },
      fileFilter: (req, file, cb) => {
        if (
          allowedMimeTypes.includes(file.mimetype) ||
          allowedMimeTypes === "*"
        ) {
          cb(null, true);
        } else {
          return cb(
            new Error(
              `Invalid file type. Allowed: ${allowedMimeTypes.join(", ")}`
            )
          );
        }
      },
    });

    dynamicUpload.single(fieldName)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded." });
      }

      try {
        const { originalname, mimetype, size, location, key, contentType } =
          req.file;
        const userId = req.user?.id || null;

        req.fileLog = await prisma.file.create({
          data: {
            userId,
            key,
            originalname,
            mimetype,
            contentType: contentType || mimetype,
            size,
            location,
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

/**
 * Upload a file directly to S3 (not via HTTP pipeline) and log it in Prisma.
 *
 * @param {Object} params
 * @param {Buffer|Uint8Array|import("stream").Readable} params.body - File data.
 * @param {string} params.originalname - Original filename (e.g. "report.pdf").
 * @param {string} [params.mimetype] - Detected MIME type (e.g. "application/pdf").
 * @param {string} [params.contentType] - Explicit content type; overrides mimetype if provided.
 * @param {number} [params.size] - File size in bytes; inferred if body is Buffer/Uint8Array.
 * @param {string|null} [params.userId=null] - Optional user id to associate with the file record.
 * @param {Record<string,string>} [params.metadata] - Optional S3 object metadata.
 * @param {string} [params.acl="public-read"] - S3 ACL.
 * @param {string} [params.prefix=process.env.PROJECT_NAME] - Key prefix/folder.
 *
 * @returns {Promise<{ key:string, location:string, etag?:string, file:{id:string} }>}
 */
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

  const key = `${prefix}/${cuid()}_${originalname}`;
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
      key,
      originalname,
      mimetype: mimetype || ContentType,
      contentType: ContentType,
      size: inferredSize,
      location: location.includes("https://")
        ? location
        : "https://" + location,
    },
  });

  return {
    key,
    location: "https://" + location,
    etag: result.ETag,
    file: fileRecord,
  };
};

/** Build a public URL for the uploaded object, handling AWS S3 and custom endpoints. */
const buildPublicUrl = ({ endpoint, bucket, region, key }) => {
  const cleanEndpoint = (endpoint || "").replace(/\/+$/, "");

  // If using standard AWS S3 and no custom endpoint, prefer virtual-hosted–style URL.
  if (!cleanEndpoint || /amazonaws\.com$/i.test(cleanEndpoint)) {
    const r = region || "us-east-1";
    return `https://${bucket}.s3.${r}.amazonaws.com/${encodeURI(key)}`;
  }

  // For custom endpoints (e.g., DigitalOcean Spaces), fall back to path-style by default.
  // Example: https://nyc3.digitaloceanspaces.com/<bucket>/<key>
  return `${cleanEndpoint}/${bucket}/${encodeURI(key)}`;
};
