import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Make My Marriage",
  description: "A planning workspace for Indian weddings.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full font-sans antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
