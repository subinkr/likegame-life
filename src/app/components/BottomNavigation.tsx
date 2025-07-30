'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '스탯', icon: '⚔️' },
    { href: '/skills', label: '스킬', icon: '📜' },
    { href: '/achievements', label: '업적', icon: '🏆' },
    { href: '/guild', label: '길드', icon: '🏰' },
    { href: '/shop', label: '상점', icon: '🛒' }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '60px',
      background: 'rgba(34,40,60,0.98)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(79,140,255,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 9999,
      transform: 'translateZ(0)',
      willChange: 'transform',
      boxShadow: '0 -2px 20px rgba(0,0,0,0.3)'
    }}>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              flex: 1,
              minWidth: 0,
              padding: '4px 2px',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              fontSize: '1.2rem',
              marginBottom: '2px',
              opacity: isActive ? 1 : 0.7,
              transition: 'all 0.2s ease'
            }}>
              {item.icon}
            </div>
            <div style={{
              fontSize: '0.65rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#ffd700' : '#bfc9d9',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
              transition: 'all 0.2s ease'
            }}>
              {item.label}
            </div>
          </Link>
        );
      })}
    </div>
  );
} 