import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { readAuthEnvironment } from "@/lib/auth/config";
import { getMongoClient } from "@/lib/db/mongodb";

function createAuth() {
  const config = readAuthEnvironment();
  if (!config) throw new Error("Authentication configuration unavailable");
  const client = getMongoClient(config);
  return betterAuth({
    appName: "Make My Marriage",
    baseURL: config.BETTER_AUTH_URL,
    secret: config.BETTER_AUTH_SECRET,
    database: mongodbAdapter(client.db(config.DATABASE_NAME), { client }),
    trustedOrigins: [new URL(config.BETTER_AUTH_URL).origin],
    socialProviders: {
      google: {
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        prompt: "select_account",
      },
    },
    session: { cookieCache: { enabled: false } },
    rateLimit: { enabled: true, storage: "database" },
    advanced: { database: { generateId: false } },
    onAPIError: { errorURL: "/login" },
  });
}

let auth: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  return (auth ??= createAuth());
}

export async function getSession(requestHeaders: Headers) {
  if (!readAuthEnvironment()) return null;
  return getAuth().api.getSession({
    headers: requestHeaders,
    query: { disableCookieCache: true },
  });
}
