import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';

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

        <section className="panel">
          <div className="panel-head"><h2>Coming soon</h2></div>
          <div className="job-detail-body">
            <p className="subcopy" style={{ marginBottom: 12 }}>
              These need a small database update before they can store real data, so they&apos;re not shown as live controls yet:
            </p>
            <ul className="coming-soon-list">
              <li>Notification preferences</li>
              <li>Saved / favourite professionals</li>
              <li>Active sessions / device management</li>
            </ul>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
