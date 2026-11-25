import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountBrand } from "@/components/account/account-brand";
import { PartnerInvitationCard } from "@/components/weddings/partner-invitation-card";
import "@/components/account/account.css";

export const metadata: Metadata = {
  title: "Partner invitation preview — Make My Marriage",
  robots: { index: false, follow: false },
};

export default function PartnerInvitationPreview() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <div className="account-app">
      <header className="account-header"><AccountBrand /></header>
      <main className="weddings-main" style={{ maxWidth: 760 }}>
        <p className="account-secondary">Design preview with sample wedding details</p>
        <PartnerInvitationCard
          inviterName="Meera"
          weddingTitle="Aarav & Meera’s Wedding"
          weddingDetails="10 December 2026 · Udaipur"
          recipientEmail="aarav@example.com"
          actions={<button className="account-button" type="button" disabled>Accept invitation</button>}
        />
      </main>
    </div>
  );
}
