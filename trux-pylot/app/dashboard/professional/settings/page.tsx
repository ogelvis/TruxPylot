import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { NotificationSettings } from '@/components/notification-settings';
import { SecurityCenter } from '@/components/security-center';

export default async function Settings() {
  const session = await requireRole('PROFESSIONAL');
  const professional = await prisma.professional.findUnique({ where: { userId: session.userId }, include: { user: true } });
  if (!professional) return null;

  return (
    <AppShell role="PROFESSIONAL" name={professional.fullName} avatarUrl={professional.avatarUrl} verified={professional.verificationStatus==='APPROVED'} active="/dashboard/professional/settings">
      <main className="dash-page">
        <h1>Account settings.</h1>
        <p className="subcopy">Manage your account security and preferences.</p>

        <div className="detail-grid">
          <section className="panel">
            <div className="panel-head"><h2>Account</h2></div>
            <div className="job-detail-body">
              <p><b>Email</b><br />{professional.user.email}</p>
              <p><b>Phone</b><br />{professional.user.phone ?? 'Not set — add one from Manage Profile'}</p>
            </div>
          </section>

        </div>

        <section className="panel">
          <div className="panel-head"><div><h2>MVault & withdrawals</h2><p>Your verified bank account and withdrawal controls are live in MVault.</p></div><a className="secondary" href="/dashboard/professional/wallet">Open MVault →</a></div>
          <div className="job-detail-body"><p className="subcopy">Bank verification, payout account management, direct bank-transfer funding and withdrawals are available from your MVault.</p></div>
        </section>

        <SecurityCenter />

        <NotificationSettings />
      </main>
    </AppShell>
  );
}
