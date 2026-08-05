import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Mail Agent",
  description: "Calm desktop-first workspace for the Mail Agent unified inbox"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
