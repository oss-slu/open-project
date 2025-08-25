// migrateUploadThingToS3.js
// ES module, named exports, arrow functions. Ready to paste.

import { prisma } from "#prisma";
import { uploadFile } from "#upload";

// Minimal extension → MIME fallback (used if server doesn't send Content-Type)
const EXT_MIME = {
  "3mf": "model/3mf",
  stl: "model/stl",
  obj: "model/obj",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  pdf: "application/pdf",
  zip: "application/zip",
};

const guessMime = (name = "", fallback = "application/octet-stream") => {
  const ext = (name.split(".").pop() || "").toLowerCase();
  return EXT_MIME[ext] || fallback;
};

const fetchAsBuffer = async (url, { retries = 3 } = {}) => {
  let err;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
      const ab = await res.arrayBuffer();
      const buf = Buffer.from(ab);
      const contentType =
        res.headers.get("content-type") ||
        guessMime(new URL(url).pathname.split("/").pop());
      return { buffer: buf, contentType };
    } catch (e) {
      err = e;
      // simple backoff: 300ms, 800ms
      if (attempt < retries - 1)
        await new Promise((r) => setTimeout(r, 300 + attempt * 500));
    }
  }
  throw err;
};

/**
 * 🔧 SURGICAL ADD: Resolve field names from a prefix or explicit overrides.
 * Example:
 *   resolveFields({ fieldPrefix: "fileThumbnail" })
 *   -> { id:"fileThumbnailId", key:"fileThumbnailKey", url:"fileThumbnailUrl", name:"fileThumbnailName", type:"fileThumbnailType" }
 */
const resolveFields = ({ fieldPrefix = "file", fieldNames = {} } = {}) => {
  const base = {
    id: `${fieldPrefix}Id`, // scalar FK (may NOT exist on some models)
    relation: fieldPrefix, // relation field (always prefer this)
    key: `${fieldPrefix}Key`,
    url: `${fieldPrefix}Url`,
    name: `${fieldPrefix}Name`,
    type: `${fieldPrefix}Type`,
  };
  return { ...base, ...fieldNames };
};

/**
 * Migrates an array of records that currently store UploadThing file fields
 * (fileKey, fileUrl, fileName, fileType) to your S3-backed File model via uploadFile().
 *
 * Assumptions:
 * - Each record has a primary key `id`.
 * - Each record has nullable `<prefix>Id` relation to File.
 * - After upload, we null out: <prefix>Key, <prefix>Url, <prefix>Name, <prefix>Type.
 * - Records live in prisma.jobItem by default; override with `model`.
 *
 * @param {Object} params
 * @param {Array}  params.records        Array of records to migrate.
 * @param {string} [params.model]        Prisma model name (default: 'jobItem').
 * @param {string} [params.idField]      Primary key field (default: 'id').
 * @param {number} [params.concurrency]  Parallelism (default: 4).
 * @param {string} [params.fieldPrefix]  Field prefix to migrate (default: 'file'). E.g. 'fileThumbnail'.
 * @param {Object} [params.fieldNames]   Explicit overrides for field names {id,key,url,name,type}.
 */
// 🔧 Change the signature & defaults to include "features"
export const migrateRecords = async ({
  records,
  model = "jobItem",
  idField = "id",
  concurrency = 4,
  fieldPrefix = "file",
  fieldNames = {},
  // choose which scalar text features to clear/touch; id is handled via relation connect/disconnect
  features = ["key", "url", "name", "type"],
} = {}) => {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("migrateRecords: 'records' must be a non-empty array");
  }

  const F = resolveFields({ fieldPrefix, fieldNames });

  const queue = [...records];
  let ok = 0;
  const failures = [];

  const buildNullData = (r) => {
    // Only include fields the caller said exist
    const data = {};
    for (const feat of features) data[F[feat]] = null;
    // Use relation field; do NOT assign to possible missing scalar FK
    // If the caller wants to explicitly clear relation, we keep current behavior:
    // if existing relation id is known and caller wants it nulled, pass disconnect.
    // Here we safely disconnect whenever no URL/Name (i.e., nothing to migrate).
    data[F.relation] =
      r?.[F.relation] || r?.[F.id] ? { disconnect: true } : undefined;
    return data;
  };

  const worker = async () => {
    while (queue.length) {
      const r = queue.shift();
      const recordId = r?.[idField];

      try {
        // Need source to fetch + a name to preserve filename
        const hasUrl = !!r?.[F.url];
        const hasName = !!r?.[F.name];

        if (!hasUrl || !hasName) {
          await prisma[model].update({
            where: { [idField]: recordId },
            data: buildNullData(r),
          });
          ok++;
          continue;
        }

        // 1) Download from UploadThing URL
        const { buffer, contentType } = await fetchAsBuffer(r[F.url]);

        // 2) Upload to S3 using your helper
        const { file } = await uploadFile({
          body: buffer,
          originalname: r[F.name],
          mimetype: contentType || guessMime(r[F.name]),
          contentType: contentType || guessMime(r[F.name]),
          userId: r.userId ?? null,
          metadata: {
            migratedFrom: "uploadthing",
            sourceUrl: r[F.url],
            originalKey: r[F.key] || "",
          },
          acl: "public-read",
        });

        // 3) Update the originating record
        const data = {};
        for (const feat of features) data[F[feat]] = null; // only null what you said exists
        data[F.relation] = { connect: { id: file.id } }; // always via relation

        await prisma[model].update({
          where: { [idField]: recordId },
          data,
        });

        console.log("Migrated", recordId, file.location);
        ok++;
      } catch (e) {
        failures.push({ id: recordId, error: String(e) });
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, records.length) }, worker)
  );

  return { migrated: ok, failed: failures.length, failures };
};

// Example convenience runner (optional). Call this from your script where `records` exist.
// Ensure you provide the array `records` in scope (each item should include at least { id, <prefix>Url, <prefix>Name }).
export const runMigration = async (records, opts = {}) => {
  const result = await migrateRecords({
    records,
    model: "jobItem",
    // e.g., migrating thumbnails that do NOT have a Type column:
    // fieldPrefix: "fileThumbnail",
    // features: ["key", "url", "name"], // omit "type" to avoid unknown-arg errors
    ...opts,
  });
  console.log(JSON.stringify(result, null, 2));
  return result;
};

/**
 * Example invocation:
 *   const FIELD_PREFIX = "file"; // or "fileThumbnail"
 *   const F = resolveFields({ fieldPrefix: FIELD_PREFIX });
 *   const records = await prisma.jobItem.findMany({
 *     where: { [F.key]: { not: null }, [F.id]: null },
 *   });
 *   await runMigration(records, { fieldPrefix: FIELD_PREFIX });
 */

// Default example using 'file' prefix:

const FIELD_PREFIX = "fileThumbnail";

const __F = resolveFields({ fieldPrefix: FIELD_PREFIX });

const records = await prisma.jobItem.findMany({
  where: {
    [__F.key]: { not: null },
    [__F.id]: null,
  },
});

console.log(`Running for ${records.length} records`);

await runMigration(records, {
  fieldPrefix: FIELD_PREFIX,
  features: ["key", "url", "name"],
});
