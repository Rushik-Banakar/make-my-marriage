import "@/components/account/account.css";

export default function LoadingWeddings() {
  return (
    <main className="account-app account-failure" aria-busy="true">
      <p role="status">Opening your wedding workspaces…</p>
    </main>
  );
}
