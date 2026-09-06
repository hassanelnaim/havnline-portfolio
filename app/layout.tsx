import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HavnLine Sales Portfolio",
  description: "Internal sales CRM for the HavnLine sales organization.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
