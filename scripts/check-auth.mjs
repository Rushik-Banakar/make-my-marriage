import { readFileSync, existsSync } from "node:fs";
import { parseEnv } from "node:util";
import { MongoClient } from "mongodb";

// Inspect configuration without printing credentials, tokens, or database URLs.
const environment = {};
for (const file of [".env", ".env.local"]) {
  if (existsSync(file)) Object.assign(environment, parseEnv(readFileSync(file, "utf8")));
}
Object.assign(environment, process.env);
const required = ["DATABASE_URL", "DATABASE_NAME", "BETTER_AUTH_URL", "BETTER_AUTH_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"];
const missing = required.filter((key) => !environment[key]?.trim());
if (missing.length) {
  console.error(`Missing authentication settings: ${missing.join(", ")}`);
  process.exit(1);
}
if (environment.BETTER_AUTH_SECRET.length < 32) {
  console.error("BETTER_AUTH_SECRET must have at least 32 characters.");
  process.exit(1);
}
if (environment.AUTH_VERIFICATION_FROM?.endsWith("@resend.dev")) {
  console.warn("Email uses Resend's restricted test sender; arbitrary recipients cannot receive verification or reset emails.");
}
console.log("Required authentication settings are present. Checking database connectivity…");
const watchdog = setTimeout(() => {
  console.error("Database check timed out. Check DNS, firewall/VPN, Atlas cluster status, and the current public IP access-list entry.");
  process.exit(1);
}, 20000);
const client = new MongoClient(environment.DATABASE_URL, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 8000,
  socketTimeoutMS: 8000,
});
try {
  await client.connect();
  await client.db(environment.DATABASE_NAME).command({ ping: 1 });
  console.log("Database connection and ping passed. This does not verify Google callbacks or email delivery.");
} catch (error) {
  const message = error instanceof Error ? error.message : "";
  if (/TLS|SSL/i.test(message)) {
    console.error("Database TLS connection failed. Check the Atlas IP access list and network TLS inspection. Certificate verification remains enabled.");
  } else if (/Authentication failed/i.test(message)) {
    console.error("Database authentication failed. Check the database user's credentials and permissions locally.");
  } else {
    console.error("Database connection failed. Check DNS, firewall/VPN, Atlas cluster status, and the current public IP access-list entry.");
  }
  process.exitCode = 1;
} finally {
  await client.close().catch(() => undefined);
  clearTimeout(watchdog);
}
