import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireOperationsSession } from '@/lib/auth';
import { SignOutLink } from '@/components/sign-out-link';

export default async function OperationsPage() {
  const session = await requireOperationsSession();
  if (!session) redirect('/login');
  const [notifications, pendingVerifications, serviceRequests] = await Promise.all([
    prisma.notification.findMany({ where: { userId: session.userId, readAt: null }, orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.verificationRequest.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'MORE_INFO_REQUIRED'] } } }),
    prisma.serviceRequest.count({ where: { status: { in: ['SUBMITTED', 'CSD_REVIEWING', 'AVAILABILITY_CONFIRMATION'] } } }),
  ]);
  return <main className="ops-page">
    <header className="ops-header"><div><p className="eyebrow">TRUXPYLOT OPERATIONS</p><h1>Operations Workspace</h1><p>Restricted workspace for assigned operational duties.</p></div><div className="ops-user">{session.email}<span className="ops-role">{session.role}</span><SignOutLink /></div></header>
    <section className="ops-grid" id="tasks">
      <article><span>◷</span><strong>{pendingVerifications}</strong><small>Verification items</small></article>
      <article><span>▣</span><strong>{serviceRequests}</strong><small>Service requests</small></article>
      <article id="notifications"><span>●</span><strong>{notifications.length}</strong><small>Unread notifications</small></article>
    </section>
    <section className="ops-panel"><h2>Assigned operations</h2><p>Your access is limited to the permissions assigned to your staff role. Sensitive infrastructure, payment secrets, database credentials and Super Admin controls are not exposed here.</p></section>
  </main>;
}
