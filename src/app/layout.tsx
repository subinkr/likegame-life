import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import AppBar from "./components/AppBar";
import BottomNavigation from "./components/BottomNavigation";

export const metadata: Metadata = {
  title: "likegame.life",
  description: "인생을 게임처럼 플레이하는 대시보드",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <AppBar />
        <div style={{ paddingTop: '56px', paddingBottom: '60px' }}>
          {children}
        </div>
        <BottomNavigation />
      </body>
    </html>
  );
}
