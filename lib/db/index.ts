import "server-only";

import mongoose from "mongoose";

import { getServerEnv } from "@/lib/env";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var __proaiMongoose: MongooseCache | undefined;
}

const cache = globalThis.__proaiMongoose ?? {
  connection: null,
  promise: null,
};

globalThis.__proaiMongoose = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.connection) {
    return cache.connection;
  }

  cache.promise ??= mongoose.connect(getServerEnv().MONGODB_URI, {
    autoIndex: process.env.NODE_ENV !== "production",
    bufferCommands: false,
    maxPoolSize: 20,
    minPoolSize: process.env.NODE_ENV === "production" ? 2 : 0,
    serverSelectionTimeoutMS: 5_000,
  });

  try {
    cache.connection = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.connection;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (!cache.connection) {
    return;
  }

  await mongoose.disconnect();
  cache.connection = null;
  cache.promise = null;
}

export { mongoose };
