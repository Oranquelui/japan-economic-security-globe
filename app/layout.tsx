import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Japan Economic Security Globe | 日本の依存インテリジェンス",
  description:
    "A public-interest semantic intelligence map of Japan's dependency exposure, domestic impact, and source-linked evidence."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
