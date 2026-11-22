import type { Metadata } from "next";
import { AuthPage } from "@/components/account/auth-page";

export const metadata: Metadata = {
  title: "Log in — Make My Marriage",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; verified?: string; reset?: string }>;
}) {
  return AuthPage({ searchParams, mode: "login" });
}
