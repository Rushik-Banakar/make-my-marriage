import Link from "next/link";

export function AccountBrand() {
  return (
    <Link
      className="account-brand"
      href="/"
      aria-label="Make My Marriage homepage"
    >
      <span>M</span>
      <div>
        Make My Marriage<small>Plan together. Celebrate together.</small>
      </div>
    </Link>
  );
}
