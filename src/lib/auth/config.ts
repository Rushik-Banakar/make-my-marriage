import { z } from "zod";

const authEnvironmentSchema = z.object({
  DATABASE_URL: z.string().regex(/^mongodb(?:\+srv)?:\/\/\S+$/),
  DATABASE_NAME: z.string().trim().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().refine((value) => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return (
      url.username === "" &&
      url.password === "" &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(url.hostname)))
    );
  }),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
});

export type AuthEnvironment = z.infer<typeof authEnvironmentSchema>;

export function readAuthEnvironment(
  environment: Record<string, string | undefined> = process.env,
): AuthEnvironment | null {
  const result = authEnvironmentSchema.safeParse(environment);
  return result.success ? result.data : null;
}
