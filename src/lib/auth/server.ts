import "server-only";
import { createHmac } from "node:crypto";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { emailOTP } from "better-auth/plugins/email-otp";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { z } from "zod";
import { readAuthEnvironment } from "@/lib/auth/config";
import { getMongoClient } from "@/lib/db/mongodb";
import { emailSchema, nameSchema, passwordMaxLength, phoneSchema, resetOtpLength, resetOtpMinutes } from "@/lib/auth/credentials";
import { getVerificationDelivery, sendAccountVerification, sendAuthEmail } from "@/lib/auth/verification-email";

async function createAuth() {
  const config = readAuthEnvironment();
  if (!config) throw new Error("Authentication configuration unavailable");
  const client = await getMongoClient(config);
  const verificationDelivery = getVerificationDelivery();
  return betterAuth({
    appName: "Make My Marriage",
    baseURL: config.BETTER_AUTH_URL,
    secret: config.BETTER_AUTH_SECRET,
    database: mongodbAdapter(client.db(config.DATABASE_NAME), { client }),
    trustedOrigins: [new URL(config.BETTER_AUTH_URL).origin],
    disabledPaths: [
      "/email-otp/send-verification-otp",
      "/email-otp/verify-email",
      "/sign-in/email-otp",
      "/forget-password/email-otp",
      "/email-otp/request-email-change",
      "/email-otp/change-email",
    ],
    plugins: verificationDelivery ? [
      emailOTP({
        otpLength: resetOtpLength,
        expiresIn: resetOtpMinutes * 60,
        allowedAttempts: 3,
        disableSignUp: true,
        storeOTP: {
          async hash(otp) {
            return createHmac("sha256", config.BETTER_AUTH_SECRET)
              .update("password-reset:" + otp).digest("hex");
          },
        },
        async sendVerificationOTP({ email, otp, type }) {
          if (type === "forget-password") {
            try {
              await sendAuthEmail(email, "Reset your Make My Marriage password",
                `Your password reset code is ${otp}. It expires in ${resetOtpMinutes} minutes. If you didn’t request it, ignore this email.`);
            } catch {
              // Keep the public response uniform when delivery fails.
              console.error("Could not send a password reset email.");
            }
          }
        },
      }),
    ] : [],
    emailAndPassword: {
      enabled: true,
      disableSignUp: !verificationDelivery,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      minPasswordLength: 1,
      maxPasswordLength: passwordMaxLength,
    },
    emailVerification: {
      ...(verificationDelivery ? { sendVerificationEmail: sendAccountVerification } : {}),
      sendOnSignUp: true,
      sendOnSignIn: true,
      expiresIn: 3600,
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        const checkingCode = ctx.path === "/email-otp/check-verification-otp";
        if (checkingCode || ctx.path === "/email-otp/reset-password") {
          const code = z.string().length(resetOtpLength).regex(/^\d+$/);
          if (!code.safeParse(ctx.body?.otp).success ||
              (checkingCode && ctx.body?.type !== "forget-password")) {
            throw new APIError("BAD_REQUEST", { code: "INVALID_OTP" });
          }
        }
        if (ctx.path !== "/sign-up/email") return;
        const email = emailSchema.safeParse(ctx.body?.email);
        if (!email.success) throw new APIError("BAD_REQUEST", { code: "INVALID_EMAIL" });
        const name = nameSchema.safeParse(ctx.body?.name);
        if (!name.success || !phoneSchema.safeParse(ctx.body?.contactPhone).success) {
          throw new APIError("BAD_REQUEST", { code: "INVALID_REGISTRATION_DETAILS" });
        }
        const existingUser = await ctx.context.internalAdapter.findUserByEmail(email.data.toLowerCase());
        if (existingUser) {
          throw new APIError("UNPROCESSABLE_ENTITY", {
            code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
            message: "An account already exists with this email. Please log in.",
          });
        }
        return { context: { body: { ...ctx.body, name: name.data, email: email.data } } };
      }),
    },
    user: {
      additionalFields: {
        contactPhone: { type: "string", required: false, returned: false, validator: { input: phoneSchema } },
      },
      validateUserInfo({ user, source }) {
        if (source.action === "link-account" && source.oauth?.providerId === "google") {
          const profile = source.oauth.profile;
          const gmail = typeof user.email === "string" && /@gmail\.com$/i.test(user.email);
          const workspace = typeof profile?.hd === "string" && profile.hd.length > 0;
          if (!gmail && !workspace) return { error: "google_email_cannot_be_linked" };
        }
      },
    },
    socialProviders: {
      google: {
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        prompt: "select_account",
        disableImplicitSignUp: true,
        disableSignUp: true,
        mapProfileToUser(profile) {
          if (profile.email_verified !== true || !z.email().safeParse(profile.email).success) {
            // Better Auth rejects an empty provider email before resolving an account.
            return { email: "", emailVerified: false };
          }
          return {};
        },
      },
    },
    session: { cookieCache: { enabled: false } },
    account: { accountLinking: { requireLocalEmailVerified: true } },
    rateLimit: { enabled: true, storage: "database" },
    advanced: { database: { generateId: false } },
    onAPIError: { errorURL: "/login" },
  });
}

let auth: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  if (!auth) {
    const initialization = createAuth().catch((error: unknown) => {
      if (auth === initialization) auth = undefined;
      throw error;
    });
    auth = initialization;
  }
  return auth;
}

export async function getSession(requestHeaders: Headers) {
  if (!readAuthEnvironment()) return null;
  return (await getAuth()).api.getSession({
    headers: requestHeaders,
    query: { disableCookieCache: true },
  });
}
