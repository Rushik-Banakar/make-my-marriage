import type { Metadata } from "next";
import { Homepage } from "@/components/marketing/homepage";

export const metadata: Metadata = {
  title: "Make My Marriage — Your wedding. Your people. One plan.",
  description:
    "A shared planning workspace for Indian weddings. Explore ceremonies, tasks, budgets, and event-specific invitations in our sample wedding preview.",
};

export default function Home() {
  return <Homepage />;
}
