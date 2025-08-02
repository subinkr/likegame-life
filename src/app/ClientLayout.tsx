'use client';
import { usePathname } from 'next/navigation';
import AppBar from "./components/AppBar";
import BottomNavigation from "./components/BottomNavigation";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth/');

  return (
    <div style={{ 
      minHeight: '100vh',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {!isAuthPage && <AppBar />}
      <main style={{ 
        paddingTop: isAuthPage ? '0' : '60px', 
        paddingBottom: isAuthPage ? '0' : '70px',
        flex: 1,
        width: '100%'
      }}>
        {children}
      </main>
      {!isAuthPage && <BottomNavigation />}
    </div>
  );
} 