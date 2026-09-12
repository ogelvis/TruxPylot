import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { NotificationSettings } from '@/components/notification-settings';
import { SecurityCenter } from '@/components/security-center';

export default async function CustomerSettings() {
  const session = await requireRole('CUSTOMER');
  const customer = await prisma.customer.findUnique({ where: { userId: session.userId }, include: { user: true } });
  if (!customer) return null;

  return (
    <AppShell role="CUSTOMER" name={customer.fullName} avatarUrl={customer.avatarUrl} active="/dashboard/customer/settings">
      <main className="dash-page">
        <h1>Account settings.</h1>
        <p className="subcopy">Manage your account security.</p>

        <div className="detail-grid">
          <section className="panel">
            <div className="panel-head"><h2>Account</h2></div>
            <div className="job-detail-body">
              <p><b>Email</b><br />{customer.user.email}</p>
              <p><b>Phone</b><br />{customer.user.phone ?? 'Not set — add one from Manage Profile'}</p>
            </div>
          </section>

        </div>

        <SecurityCenter />

        <NotificationSettings />
      </main>
    </AppShell>
  );
}
