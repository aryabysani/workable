import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorkAble — Inclusive Job Matching",
  description:
    "WorkAble connects job-ready autistic and neurodiverse adults with neuroinclusive employers.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
