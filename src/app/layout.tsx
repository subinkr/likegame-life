import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "likegame.life",
  description: "인생을 게임처럼 플레이하는 대시보드",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <ChatProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
