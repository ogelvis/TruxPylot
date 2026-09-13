import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { NotificationSettings } from '@/components/notification-settings';
import { SecurityCenter } from '@/components/security-center';

export default async function Settings() {
  const session = await requireRole('PROFESSIONAL');
  const professional = await prisma.professional.findUnique({ where: { userId: session.userId }, include: { user: true } });
  if (!professional) return null;
  return <AppShell role="PROFESSIONAL" name={professional.fullName} avatarUrl={professional.avatarUrl} verified={professional.verificationStatus==='APPROVED'} active="/dashboard/professional/settings">
    <main className="dash-page futuristic-settings">
      <section className="settings-hero">
        <div><p className="signal-kicker">TRUXPYLOT / CONTROL ROOM</p><h1>Settings, <em>without the noise.</em></h1><p>Manage the few controls that matter: account identity, notifications, security and your financial shortcuts.</p></div>
        <div className="settings-status"><span>ACCOUNT</span><strong>ACTIVE</strong><small>{professional.user.email}</small></div>
      </section>
      <section className="settings-quick-grid">
        <a href="#security"><span>01</span><b>Security</b><small>Password, recovery & 2FA</small></a>
        <a href="#notifications"><span>02</span><b>Notifications</b><small>Choose what reaches you</small></a>
        <a href="/dashboard/professional/wallet"><span>03</span><b>MVault</b><small>Funding & withdrawals</small></a>
        <a href="/dashboard/professional/profile"><span>04</span><b>Profile</b><small>Public professional identity</small></a>
      </section>
      <section className="settings-account-strip"><div><span>EMAIL</span><b>{professional.user.email}</b></div><div><span>PHONE</span><b>{professional.user.phone ?? 'Not set'}</b></div><div><span>VERIFICATION</span><b>{professional.verificationStatus === 'APPROVED' ? 'Verified' : 'Pending'}</b></div></section>
      <div id="security" className="settings-section-heading"><span>01</span><div><p>ACCOUNT PROTECTION</p><h2>Security</h2></div></div>
      <SecurityCenter />
      <div id="notifications" className="settings-section-heading"><span>02</span><div><p>DELIVERY CONTROL</p><h2>Notifications</h2></div></div>
      <NotificationSettings />
      <div className="settings-section-heading"><span>03</span><div><p>FINANCIAL CONTROL</p><h2>MVault</h2></div></div>
      <section className="settings-mvault"><div><span>PYLOTVAULT</span><h2>Your financial center stays separate and focused.</h2><p>Bank verification, direct transfer funding, Paystack funding and withdrawals live inside MVault.</p></div><a href="/dashboard/professional/wallet">Open MVault →</a></section>
    </main>
  </AppShell>;
}
