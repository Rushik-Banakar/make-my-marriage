import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { AccountBrand } from "@/components/account/account-brand";
import { CreateWeddingForm } from "@/components/weddings/create-wedding-form";
import "@/components/account/account.css";

export const metadata: Metadata = { title: "Create a Wedding — Make My Marriage", robots: { index: false, follow: false } };

export default async function NewWeddingPage() {
  const session = await getSession(await headers());
  if (!session) redirect("/login");
  return <div className="account-app">
    <header className="account-header"><AccountBrand /><Link className="account-text-link" href="/weddings">Back to My Weddings</Link></header>
    <main className="weddings-main wedding-wizard-main">
      <div className="setup-page-title"><span className="account-eyebrow">A beautiful beginning</span><h1>Create your wedding</h1></div>
      <CreateWeddingForm />
    </main>
  </div>;
}
