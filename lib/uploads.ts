import "server-only";

import { randomUUID } from "node:crypto";

import { connectToDatabase, mongoose } from "@/lib/db";

const BUCKET_NAME = "uploads";

async function uploadBucket() {
  await connectToDatabase();
  const database = mongoose.connection.db;
  if (!database) throw new Error("Database is not connected");
  return new mongoose.mongo.GridFSBucket(database, { bucketName: BUCKET_NAME });
}

export async function storeUploadedImage(
  folder: "avatars" | "content" | "messages",
  extension: "jpg" | "png" | "webp",
  contentType: string,
  bytes: Uint8Array,
): Promise<string> {
  const filename = `${folder}/${randomUUID()}.${extension}`;
  const stream = (await uploadBucket()).openUploadStream(filename, {
    metadata: { contentType },
  });

  await new Promise<void>((resolve, reject) => {
    stream.once("finish", resolve);
    stream.once("error", reject);
    stream.end(Buffer.from(bytes));
  });

  return `/api/uploads/${filename}`;
}

export async function readUploadedImage(filename: string) {
  const bucket = await uploadBucket();
  const file = await bucket.find({ filename }).sort({ uploadDate: -1 }).limit(1).next();
  if (!file) return null;

  const chunks: Buffer[] = [];
  for await (const chunk of bucket.openDownloadStream(file._id)) {
    chunks.push(Buffer.from(chunk));
  }

  return {
    bytes: Buffer.concat(chunks),
    contentType:
      typeof file.metadata?.contentType === "string"
        ? file.metadata.contentType
        : "application/octet-stream",
  };
}
