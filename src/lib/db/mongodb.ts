import "server-only";
import { MongoClient } from "mongodb";
import type { AuthEnvironment } from "@/lib/auth/config";

const globalDatabase = globalThis as typeof globalThis & {
  marriageMongoConnection?: Promise<MongoClient>;
};

export function getMongoClient(config: AuthEnvironment): Promise<MongoClient> {
  // Share initialization too: adapter index creation must not race a failed
  // implicit connection and leave subsequent requests using a closed topology.
  if (!globalDatabase.marriageMongoConnection) {
    const client = new MongoClient(config.DATABASE_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    const connection = client.connect().catch(async (error: unknown) => {
      if (globalDatabase.marriageMongoConnection === connection) {
        globalDatabase.marriageMongoConnection = undefined;
      }
      await client.close().catch(() => undefined);
      throw error;
    });
    globalDatabase.marriageMongoConnection = connection;
  }
  return globalDatabase.marriageMongoConnection;
}

export async function getDatabase() {
  const { readAuthEnvironment } = await import("@/lib/auth/config");
  const config = readAuthEnvironment();
  if (!config) throw new Error("Authentication configuration unavailable");
  return (await getMongoClient(config)).db(config.DATABASE_NAME);
}
