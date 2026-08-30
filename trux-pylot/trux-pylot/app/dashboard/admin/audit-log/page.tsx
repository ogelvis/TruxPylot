import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';

export default async function AuditLog() {
  await requireRole('ADMIN');

  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/audit-log">
      <main className="dash-page">
        <p className="page-kicker">AUDIT LOG</p>
        <h1>Every sensitive action, traceable.</h1>
        <p className="subcopy">Most recent 100 administrative actions across the platform.</p>

        <div className="panel">
          {logs.length ? logs.map(l => (
            <div className="table-row audit-row" key={l.id}>
              <div className="job-name">
                <b>{l.action.replaceAll('_', ' ')} — {l.entity}</b>
                <span>{l.user?.email ?? 'System'}{l.entityId ? ` · ${l.entityId.slice(-8)}` : ''}</span>
              </div>
              <small>{new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(l.createdAt)}</small>
            </div>
          )) : <div className="empty">No administrative actions recorded yet.</div>}
        </div>
      </main>
    </AppShell>
  );
}
