import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "Like Game",
  description: "인생을 게임처럼",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
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
