import Link from 'next/link';
import type { Role } from '@prisma/client';
import type { ReactNode } from 'react';
import { MobileTabBar } from '@/components/mobile-tab-bar';
import { NotificationBell } from '@/components/notification-bell';
import { SignOutLink } from '@/components/sign-out-link';
import { SecurityReminder } from '@/components/security-reminder';

const nav: Record<Role, { label: string; href: string; icon: string }[]> = {
  CUSTOMER: [
    { label: 'Overview', href: '/dashboard/customer', icon: '⌂' },
    { label: 'My requests', href: '/dashboard/customer/jobs', icon: '▣' },
    { label: 'Service requests', href: '/dashboard/customer/service-requests', icon: '☎' },
    { label: 'Messages', href: '/dashboard/customer/messages', icon: '✉' },
    { label: 'Refer & earn', href: '/dashboard/customer/referrals', icon: '↗' },
    { label: 'Find a professional', href: '/marketplace', icon: '◎' },
    { label: 'Manage profile', href: '/dashboard/customer/profile', icon: '◈' },
    { label: 'Settings', href: '/dashboard/customer/settings', icon: '⚙' },
  ],

  PROFESSIONAL: [
    { label: 'Overview', href: '/dashboard/professional', icon: '⌂' },
    { label: 'My jobs', href: '/dashboard/professional/jobs', icon: '▣' },
    { label: 'Messages', href: '/dashboard/professional/messages', icon: '✉' },
    { label: 'Earnings', href: '/dashboard/professional/earnings', icon: '◈' },
    { label: 'MVault', href: '/dashboard/professional/wallet', icon: '₦' },
    { label: 'Grow & promote', href: '/dashboard/professional/growth', icon: '✦' },
    { label: 'Refer & earn', href: '/dashboard/professional/referrals', icon: '↗' },
    { label: 'Reviews', href: '/dashboard/professional/reviews', icon: '★' },
    { label: 'Verification', href: '/dashboard/professional/verification', icon: '✓' },
    { label: 'Manage profile', href: '/dashboard/professional/profile', icon: '◎' },
    { label: 'Settings', href: '/dashboard/professional/settings', icon: '⚙' },
  ],

  ADMIN: [
    { label: 'Overview', href: '/dashboard/admin', icon: '⌂' },
    { label: 'Service requests (CSD)', href: '/dashboard/admin/service-requests', icon: '☎' },
    { label: 'Verifications', href: '/dashboard/admin/verifications', icon: '✓' },
    { label: 'Referrals', href: '/dashboard/admin/referrals', icon: '↗' },
    { label: 'Users', href: '/dashboard/admin/users', icon: '◎' },
    { label: 'PYLOTVAULT Finance', href: '/dashboard/admin/wallet', icon: '₦' },
    { label: 'Growth requests', href: '/dashboard/admin/growth', icon: '✦' },
    { label: 'Staff access', href: '/dashboard/admin/staff', icon: '♟' },
    { label: 'Security Center', href: '/dashboard/admin/security', icon: '⌁' },
    { label: 'Announcements', href: '/dashboard/admin/announcements', icon: '●' },
    { label: 'Audit log', href: '/dashboard/admin/audit-log', icon: '▣' },
  ],

  EDITOR: [
    { label: 'Operations', href: '/operations', icon: '⌘' },
    { label: 'Notifications', href: '/operations#notifications', icon: '●' },
    { label: 'Assigned work', href: '/operations#tasks', icon: '▣' },
  ],

  OPERATOR: [
    { label: 'Operations', href: '/operations', icon: '⌘' },
    { label: 'Notifications', href: '/operations#notifications', icon: '●' },
    { label: 'Assigned work', href: '/operations#tasks', icon: '▣' },
  ],

  SUPER_ADMIN: [
    { label: 'Admin Control Center', href: '/dashboard/admin', icon: '⌂' },
  ],
};

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

type AppShellProps = {
  role: Role;
  name: string;
  avatarUrl?: string | null;
  verified?: boolean;
  premium?: boolean;
  children: ReactNode;
  active?: string;
  isBusiness?: boolean;
};

export function AppShell({
  role,
  name,
  avatarUrl,
  verified,
  premium,
  children,
  active,
  isBusiness,
}: AppShellProps) {
  const items =
    role === 'PROFESSIONAL' && isBusiness
      ? [
          ...nav[role],
          {
            label: 'Team management',
            href: '/dashboard/professional/team',
            icon: '♟',
          },
        ]
      : nav[role];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="dash-brand" href="/">
          <img src="/trux-pylot-logo.png" alt="Trux Pylot" />
        </Link>

        <div className="sidebar-identity">
          <span className="sidebar-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} />
            ) : (
              initials(name)
            )}
          </span>

          <div className="sidebar-identity-text">
            <b>{name}</b>

            <div className="sidebar-role-row">
              <span>{role.toLowerCase()}</span>

              {verified && (
                <span className="verified-chip">✓ Verified</span>
              )}

              {premium && (
                <span className="verified-chip">★ Premium</span>
              )}
            </div>
          </div>
        </div>

        <p className="nav-title">WORKSPACE</p>

        <nav>
          {items.map((item) => (
            <Link
              className={
                (active ?? items[0].href) === item.href ? 'active' : ''
              }
              key={item.href}
              href={item.href}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-account-actions">
          <div className="sidebar-signout">
            <SignOutLink />
          </div>
        </div>

        <div className="support-card">
          <span>◌</span>
          <b>Need assistance?</b>
          <p>Our support team is here to help.</p>
          <a href="mailto:info@truxpylot.com">Contact support →</a>
        </div>
      </aside>

      <section className="dashboard-content">
        <header className="dash-header">
          <div className="mobile-brand">
            <span className="mobile-brand-logo">TRUX PYLOT</span>
            <span className="mobile-brand-greeting">
              Hi, {name.split(' ')[0]} 👋
            </span>
          </div>

          <div className="header-right">
            <NotificationBell />

            <div className="header-signout">
              <SignOutLink />
            </div>

            <Link
              href={
                role === 'ADMIN' || role === 'SUPER_ADMIN'
                  ? '/dashboard/NgNji'
                  : `/dashboard/${role.toLowerCase()}/profile`
              }
              className="user-chip"
            >
              <span>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} />
                ) : (
                  initials(name)
                )}
              </span>

              <div>
                <b>{name}</b>
                <small>{role.toLowerCase()}</small>
              </div>
            </Link>
          </div>
        </header>

        {children}

        <SecurityReminder role={role} />

        <MobileTabBar
          role={role}
          active={active ?? items[0].href}
        />
      </section>
    </div>
  );
}
