import type { Metadata } from "next";
import packageJson from "../package.json";
import "./globals.css";

export const metadata: Metadata = {
  title: "日本経済安全保障マップ | 日本の依存インテリジェンス",
  description:
    "日本の依存関係、国内影響、出典根拠を結ぶ公共目的のセマンティック・インテリジェンスマップ。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <head>
        <meta name="release-sha" content={process.env.NEXT_PUBLIC_RELEASE_SHA ?? "local"} />
        <meta name="release-version" content={packageJson.version} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
