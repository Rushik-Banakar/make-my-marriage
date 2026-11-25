import { loadEnvFile } from "node:process";
import { existsSync } from "node:fs";
import { MongoClient } from "mongodb";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) loadEnvFile(file);
}

const { DATABASE_URL, DATABASE_NAME } = process.env;
if (!DATABASE_URL || !DATABASE_NAME) {
  console.error("Set DATABASE_URL and DATABASE_NAME before running database setup.");
  process.exit(1);
}

const client = new MongoClient(DATABASE_URL, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
});

try {
  const db = client.db(DATABASE_NAME);
  await db.collection("weddings").createIndex({ slug: 1 }, { unique: true });
  const invites = db.collection("memberInvites");
  await invites.createIndex({ tokenHash: 1 }, { unique: true });
  await invites.createIndex({ weddingId: 1, status: 1 });
  const members = db.collection("weddingMembers");
  await members.createIndex({ weddingId: 1, authUserId: 1 }, { unique: true });
  await members.createIndex({ authUserId: 1, status: 1 });
  await members.createIndex({ weddingId: 1, ownerSeat: 1 }, {
    unique: true, partialFilterExpression: { role: "admin", status: "active" },
  });
  for (const name of ["weddingSites", "weddingBudgets", "weddingPlans", "storageUsage"]) {
    await db.collection(name).createIndex({ weddingId: 1 }, { unique: true });
  }
  await db.collection("auditEvents").createIndex({ weddingId: 1, occurredAt: -1 });
  await db.collection("requestLogs").createIndex({ occurredAt: 1 }, { expireAfterSeconds: 2592000 });
  console.log("Wedding indexes and request log retention are ready.");
} catch (error) {
  const code = typeof error?.code === "number" ? " MongoDB code " + error.code + "." : "";
  console.error("Database setup failed. Check connectivity, index permissions, and existing index definitions." + code);
  process.exitCode = 1;
} finally {
  await client.close();
}
