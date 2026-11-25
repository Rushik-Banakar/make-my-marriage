import type { ReactNode } from "react";

type PartnerInvitationCardProps = {
  inviterName: string;
  weddingTitle: string;
  weddingDetails: string;
  recipientEmail: string;
  actions: ReactNode;
};

export function PartnerInvitationCard({
  inviterName, weddingTitle, weddingDetails, recipientEmail, actions,
}: PartnerInvitationCardProps) {
  return (
    <section className="wedding-setup-card" aria-labelledby="partner-invite-title">
      <span className="account-eyebrow">Partner invitation</span>
      <h1 id="partner-invite-title">{inviterName} invited you to plan your wedding together</h1>
      <h2>{weddingTitle}</h2>
      <p>{weddingDetails}</p>
      <dl className="wedding-details">
        <div><dt>Your role</dt><dd>Co-owner · Equal Admin access</dd></div>
        <div><dt>Invited email</dt><dd style={{ overflowWrap: "anywhere" }}>{recipientEmail}</dd></div>
      </dl>
      <p className="account-secondary">Accept with the invited email to share management of this private wedding workspace.</p>
      {actions}
    </section>
  );
}
