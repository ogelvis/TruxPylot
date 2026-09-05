import Link from 'next/link';
import { Role } from '@prisma/client';

const TABS: Record<Role, { label: string; href: string; icon: string }[]> = {
  CUSTOMER: [
    { label: 'Home', href: '/dashboard/customer', icon: '⌂' },
    { label: 'Requests', href: '/dashboard/customer/jobs', icon: '▣' },
    { label: 'Find Pro', href: '/marketplace', icon: '◎' },
    { label: 'Support', href: '/support', icon: '☎' },
    { label: 'Profile', href: '/dashboard/customer/profile', icon: '◈' },
  ],
  PROFESSIONAL: [
    { label: 'Home', href: '/dashboard/professional', icon: '⌂' },
    { label: 'Jobs', href: '/dashboard/professional/jobs', icon: '▣' },
    { label: 'Earnings', href: '/dashboard/professional/earnings', icon: '◈' },
    { label: 'Tier', href: '/dashboard/professional/tier', icon: '◆' },
    { label: 'Support', href: '/support', icon: '☎' },
    { label: 'Profile', href: '/dashboard/professional/profile', icon: '◎' },
  ],
  ADMIN: [
    { label: 'Home', href: '/dashboard/admin', icon: '⌂' },
    { label: 'CSD', href: '/dashboard/admin/service-requests', icon: '☎' },
    { label: 'Verify', href: '/dashboard/admin/verifications', icon: '✓' },
    { label: 'Users', href: '/dashboard/admin/users', icon: '◎' },
  ],
};

export function MobileTabBar({ role, active }: { role: Role; active?: string }) {
  const tabs = TABS[role];
  return (
    <nav className="mobile-tab-bar">
      {tabs.map(t => (
        <Link key={t.href} href={t.href} className={active === t.href ? 'active' : ''}>
          <span>{t.icon}</span>{t.label}
        </Link>
      ))}
    </nav>
  );
}
