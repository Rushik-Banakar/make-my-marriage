import type { Metadata } from "next";
import { AuthPage } from "@/components/account/auth-page";

export const metadata: Metadata = {
  title: "Sign up — Make My Marriage",
  robots: { index: false, follow: false },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  return AuthPage({ searchParams, mode: "signup" });
}
