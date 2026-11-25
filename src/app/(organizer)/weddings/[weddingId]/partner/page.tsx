import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { getMyWedding } from "@/modules/weddings/service";
import { partnerPanel } from "@/modules/weddings/partner-invites";
import { PartnerOrganizer } from "@/components/weddings/partner-organizer";
import { AccountBrand } from "@/components/account/account-brand";
import "@/components/account/account.css";
import "@/components/weddings/partner.css";

export default async function PartnerPage({ params }: { params: Promise<{ weddingId: string }> }) {
  const session = await getSession(await headers());
  if (!session) redirect("/login");
  const { weddingId } = await params;
  const wedding = await getMyWedding(weddingId, session.user.id);
  if (!wedding || wedding.myRole !== "admin") notFound();
  const panel = await partnerPanel(weddingId, session.user.id);
  const title = wedding.title || wedding.brideName + " & " + wedding.groomName;
  return <div className="account-app"><header className="account-header"><AccountBrand /></header>
    <main className="weddings-main partner-main">
      <Link className="account-text-link" href={"/weddings/" + weddingId}>← Back to {title}</Link>
      <h1>Invite your partner</h1>
      <p className="weddings-intro">Invite your partner to plan this wedding with you. You’ll both have equal Admin access.</p>
      <div className="partner-layout"><PartnerOrganizer weddingId={weddingId} panel={panel} ownEmail={session.user.email}
        bride={wedding.brideName} groom={wedding.groomName} />
        <aside className="partner-preview"><span className="account-eyebrow">What your partner will see</span>
          <h2>{title}</h2><p>{session.user.name} invited you to plan your wedding together.</p>
          <p>Open the email and sign in with the invited address to accept co-ownership.</p>
        </aside></div>
    </main></div>;
}
