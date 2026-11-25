import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { listMyWeddings } from "@/modules/weddings/service";
import { AccountBrand } from "@/components/account/account-brand";
import { WeddingLifecycleControl } from "@/components/weddings/wedding-lifecycle-control";
import "@/components/account/account.css";

export const metadata: Metadata = { title: "Deleted Weddings — Make My Marriage", robots: { index: false, follow: false } };
export default async function DeletedWeddingsPage() {
  const session = await getSession(await headers());
  if (!session) redirect("/login");
  const weddings = await listMyWeddings(session.user.id, true);
  return <div className="account-app"><header className="account-header"><AccountBrand /><Link href="/weddings">My Weddings</Link></header>
    <main className="weddings-main"><h1>Deleted weddings</h1><p>Weddings you deleted are retained here so you can restore them. Their websites remain unpublished.</p>
      {weddings.length === 0 && <p>No deleted weddings.</p>}
      {weddings.map((wedding) => <article className="wedding-setup-card" key={wedding.id}><h2>{wedding.brideName} &amp; {wedding.groomName}</h2>
        {wedding.slug && <WeddingLifecycleControl id={wedding.id} slug={wedding.slug} restore />}</article>)}
    </main></div>;
}
