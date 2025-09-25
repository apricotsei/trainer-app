import type { Metadata } from "next";
// Noto Sans JPフォントをインポート（モダンなUIのための推奨設定）
import { Noto_Sans_JP } from "next/font/google"; 
// ★★★ この行が最も重要です ★★★
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { DashboardHeader } from "@/components/DashboardHeader";

// フォント設定
const notoSansJp = Noto_Sans_JP({ 
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "トレーナーアプリ",
  description: "トレーナー向けシフト管理アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {/* bodyタグにフォントとTailwind CSSのクラスを適用 */}
      <body className={`${notoSansJp.className} antialiased`}>
        <AuthProvider>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
