import type { Metadata } from "next";
import { Geist, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  display: "swap"
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  variable: "--font-ibm-plex-mono"
});

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
      <body className={`${geist.className} ${ibmPlexMono.variable}`}>{children}</body>
    </html>
  );
}
