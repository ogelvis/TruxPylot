import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';
import { UserStatusActions } from '@/components/user-status-actions';

export default async function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('ADMIN');
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      customer: true,
      professional: true,
    },
  });
  if (!user) notFound();

  const jobCount = user.customer
    ? await prisma.job.count({ where: { customerId: user.customer.id } })
    : user.professional
    ? await prisma.job.count({ where: { professionalId: user.professional.id } })
    : 0;

  const recentActivity = await prisma.auditLog.findMany({
    where: { entity: 'User', entityId: id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const name = user.customer?.fullName ?? user.professional?.fullName ?? user.email;

  return (
    <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/users">
      <main className="dash-page">
        <Link href="/dashboard/admin/users" className="back-link">← Back to users</Link>
        <div className="overview-top">
          <div>
            <p className="page-kicker">USER PROFILE</p>
            <h1>{name}</h1>
          </div>
          <span className={`status ${user.status.toLowerCase()}`}>{user.status}</span>
        </div>

        <section className="detail-grid">
          <div className="panel">
            <div className="panel-head"><h2>Account</h2></div>
            <div className="job-detail-body">
              <p><b>Email</b> — {user.email}</p>
              <p><b>Phone</b> — {user.phone ?? 'Not provided'}</p>
              <p><b>Role</b> — {user.role}</p>
              <p><b>Joined</b> — {new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(user.createdAt)}</p>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><h2>Activity</h2></div>
            <div className="job-detail-body">
              <p><b>{jobCount}</b> job{jobCount === 1 ? '' : 's'} on record</p>
              {user.professional && <p><b>Verification</b> — {user.professional.verificationStatus}</p>}
              {user.professional && <p><b>Rating</b> — {user.professional.rating.toFixed(1)} ★</p>}
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><h2>Status</h2></div>
            <div className="job-detail-body">
              {user.status !== 'ACTIVE' && (
                <>
                  {user.suspendedUntil && <p><b>Until</b> — {new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(user.suspendedUntil)}</p>}
                  {user.suspensionReason && <p><b>Reason</b> — {user.suspensionReason}</p>}
                </>
              )}
              {user.role === 'ADMIN' ? (
                <p className="subcopy">Administrator accounts cannot be modified from this panel.</p>
              ) : (
                <UserStatusActions userId={user.id} currentStatus={user.status} />
              )}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Moderation history</h2></div>
          {recentActivity.length ? recentActivity.map(a => (
            <div className="table-row" key={a.id}>
              <div className="job-name"><b>{a.action}</b></div>
              <small>{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(a.createdAt)}</small>
            </div>
          )) : <div className="empty">No moderation actions recorded for this user.</div>}
        </section>
      </main>
    </AppShell>
  );
}
