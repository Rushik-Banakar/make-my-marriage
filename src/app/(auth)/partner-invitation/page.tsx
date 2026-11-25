import { headers } from "next/headers";
import { getSession } from "@/lib/auth/server";
import { AccountBrand } from "@/components/account/account-brand";
import { PartnerRecipient } from "@/components/weddings/partner-recipient";
import "@/components/account/account.css";

export const metadata = { title: "Partner invitation — Make My Marriage", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function RecipientPage() {
  const session = await getSession(await headers());
  return <div className="account-app"><header className="account-header"><AccountBrand /></header>
    <main className="weddings-main" style={{ maxWidth: 760 }}><PartnerRecipient signedIn={Boolean(session)} /></main></div>;
}
