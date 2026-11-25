import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { getMyWedding } from "@/modules/weddings/service";
import { AccountBrand } from "@/components/account/account-brand";
import { SignOutButton } from "@/components/account/auth-controls";
import { WeddingLifecycleControl } from "@/components/weddings/wedding-lifecycle-control";
import "@/components/account/account.css";

export const metadata: Metadata = { title: "Wedding Workspace — Make My Marriage", robots: { index: false, follow: false } };

export default async function WeddingPage({ params }: { params: Promise<{ weddingId: string }> }) {
  const session = await getSession(await headers());
  if (!session) redirect("/login");
  const { weddingId } = await params;
  const wedding = await getMyWedding(weddingId, session.user.id);
  if (!wedding) notFound();
  return <div className="account-app">
    <header className="account-header"><AccountBrand /><SignOutButton /></header>
    <main className="weddings-main">
      <Link className="account-text-link" href="/weddings">← My Weddings</Link>
      <span className="account-eyebrow workspace-eyebrow">Your private wedding workspace · {wedding.status}</span>
      <h1>{wedding.title || `${wedding.brideName} & ${wedding.groomName}`}</h1>
      {wedding.title && <p>{wedding.brideName} &amp; {wedding.groomName}</p>}
      <p className="weddings-intro">{new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: wedding.timezone }).format(new Date(wedding.startAt))} · {wedding.timezone}</p>
      <section className="wedding-setup-card" aria-labelledby="workspace-title">
        <h2 id="workspace-title">A home for your celebration</h2>
        <dl className="wedding-details">
          {wedding.location && <div><dt>City or location</dt><dd>{wedding.location}</dd></div>}
          {wedding.description && <div><dt>Description</dt><dd style={{ whiteSpace: "pre-wrap" }}>{wedding.description}</dd></div>}
          <div><dt>Your role</dt><dd>{wedding.myRole === "admin" ? `Co-owner · ${wedding.ownerSeat}` : "Organizer"}</dd></div>
          <div><dt>Wedding website address</dt><dd>{wedding.slug}</dd></div>
          <div><dt>Website visibility</dt><dd>Private draft</dd></div>
        </dl>
        <p className="account-secondary">Your workspace is saved. Partner invitations, events and planning tools are coming in the next milestones.</p>
      </section>
      {wedding.myRole === "admin" && <WeddingLifecycleControl id={wedding.id} slug={wedding.slug} />}
    </main>
  </div>;
}
