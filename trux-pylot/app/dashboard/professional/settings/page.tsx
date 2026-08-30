import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';

export default async function Settings() {
  const session = await requireRole('PROFESSIONAL');
  const professional = await prisma.professional.findUnique({ where: { userId: session.userId }, include: { user: true } });
  if (!professional) return null;

  return (
    <AppShell role="PROFESSIONAL" name={professional.fullName} active="/dashboard/professional/settings">
      <main className="dash-page">
        <p className="page-kicker">SETTINGS</p>
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
          <div className="panel-head"><h2>Coming soon</h2></div>
          <div className="job-detail-body">
            <p className="subcopy" style={{ marginBottom: 12 }}>
              These settings need a small database update before they can store real data —
              they are not live yet so we are not showing controls that would not actually save anything:
            </p>
            <ul className="coming-soon-list">
              <li>Bank account &amp; withdrawal settings</li>
              <li>Active sessions / device management</li>
              <li>Notification preferences (jobs, messages, payments, announcements)</li>
              <li>Profile visibility &amp; communication preferences</li>
            </ul>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
