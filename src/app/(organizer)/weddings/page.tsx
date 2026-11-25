import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { listMyWeddings } from "@/modules/weddings/service";
import { AccountBrand } from "@/components/account/account-brand";
import { SignOutButton } from "@/components/account/auth-controls";
import { Icon } from "@/components/marketing/icon";
import { WeddingLifecycleControl } from "@/components/weddings/wedding-lifecycle-control";
import "@/components/account/account.css";

export const metadata: Metadata = {
  title: "My Weddings — Make My Marriage",
  robots: { index: false, follow: false },
};

export default async function MyWeddingsPage() {
  const session = await getSession(await headers());
  if (!session) redirect("/login");
  const weddings = await listMyWeddings(session.user.id);
  return (
    <div className="account-app weddings-page">
      <header className="account-header">
        <AccountBrand />
        <div className="account-header-right">
          <span className="account-avatar" aria-hidden="true">
            {session.user.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="account-name">{session.user.name}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="weddings-main">
        <span className="account-eyebrow">Your celebrations, together</span>
        <h1>My Weddings</h1>
        <p className="weddings-intro">
          Welcome, {session.user.name.split(" ")[0]}. A home for the
          celebrations you’re part of.
        </p>
        <Link className="account-button create-wedding-link" href="/weddings/new">Create a wedding</Link>
        <p><Link className="account-text-link" href="/weddings/deleted">Deleted weddings</Link></p>
        <div className="weddings-section-title">
          <h2>Your wedding workspaces</h2>
          <span>
            {weddings.length} {weddings.length === 1 ? "wedding" : "weddings"}
          </span>
        </div>
        {weddings.length === 0 ? (
          <section className="weddings-empty">
            <span className="empty-icon">
              <Icon name="flower" />
            </span>
            <span className="account-eyebrow">A beautiful beginning</span>
            <h2>Your celebrations will live here.</h2>
            <p>
              You haven’t joined a wedding workspace yet. Weddings you create or
              join through an accepted invitation will appear here.
            </p>
            <p className="account-secondary">
              Create your wedding to get started. Partner invitations are coming
              in the next milestone.
            </p>
            <Link className="account-button" href="/#demo">
              Explore the sample wedding
            </Link>
          </section>
        ) : (
          <div className="wedding-card-grid">
            {weddings.map((wedding) => (
              <article className="wedding-card" key={wedding.id}>
                <div className="wedding-card-cover">
                  <Icon name="flower" />
                  <span className="account-pill">
                    {wedding.myRole === "admin" ? "Co-owner" : "Organizer"}
                  </span>
                </div>
                <div className="wedding-card-body">
                  <span className="account-eyebrow">{wedding.status}</span>
                  <h2>
                    {wedding.brideName} & {wedding.groomName}
                  </h2>
                  <p>
                    <Icon name="calendar" />
                    {new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "long",
                      timeZone: wedding.timezone,
                    }).format(new Date(wedding.startAt))}
                  </p>
                  <Link className="account-button subtle" href={`/weddings/${wedding.id}`}>Open wedding</Link>
                  {wedding.myRole === "admin" && wedding.slug && <WeddingLifecycleControl id={wedding.id} slug={wedding.slug} />}
                </div>
              </article>
            ))}
          </div>
        )}
        <aside className="weddings-privacy">
          <Icon name="shield" />
          <p>
            Only weddings with an active membership are shown. Each wedding has
            its own roles and permissions.
          </p>
        </aside>
      </main>
      <footer className="account-footer">
        <Link href="/">Back to Make My Marriage</Link>
        <span>Your wedding. Your people. One plan.</span>
      </footer>
    </div>
  );
}
