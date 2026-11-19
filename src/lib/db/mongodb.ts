import "server-only";
import { MongoClient } from "mongodb";
import type { AuthEnvironment } from "@/lib/auth/config";

const globalDatabase = globalThis as typeof globalThis & {
  marriageMongoClient?: MongoClient;
};

export function getMongoClient(config: AuthEnvironment) {
  // Reuse the driver's connection pool across requests and development reloads.
  if (!globalDatabase.marriageMongoClient) {
    globalDatabase.marriageMongoClient = new MongoClient(config.DATABASE_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      timeoutMS: 10000,
    });
  }
  return globalDatabase.marriageMongoClient;
}

export async function getDatabase() {
  const { readAuthEnvironment } = await import("@/lib/auth/config");
  const config = readAuthEnvironment();
  if (!config) throw new Error("Authentication configuration unavailable");
  return getMongoClient(config).db(config.DATABASE_NAME);
}
