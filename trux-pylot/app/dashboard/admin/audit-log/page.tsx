import { requireRole } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';

export const dynamic = 'force-dynamic';

export default async function AuditLog() {
  await requireRole('ADMIN');
  const logs = await prisma.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  return <AppShell role="ADMIN" name="Platform admin" active="/dashboard/admin/audit-log"><main className="dash-page admin-audit-future">
    <section className="admin-section-hero audit-hero-future"><div><span className="admin-future-kicker">MASTER CONTROL / ACCOUNTABILITY</span><h1>Audit trail, <em>made readable.</em></h1><p>Every sensitive action stays visible, time-stamped and connected to its actor.</p></div><div className="audit-live-chip"><i/> LIVE LOG <strong>{logs.length}</strong></div></section>
    <section className="audit-summary"><div><span>EVENTS IN VIEW</span><b>{logs.length}</b></div><div><span>TRACKING</span><b>ACTIVE</b></div><div><span>RETENTION</span><b>DATABASE</b></div></section>
    <section className="audit-timeline"><div className="audit-timeline-head"><div><span>01 / SECURITY RECORD</span><h2>Recent administrative activity</h2></div><small>Latest 100 events</small></div>
      {logs.length ? logs.map((l,i)=><div className="audit-event" key={l.id}><div className="audit-event-rail"><span>{String(i+1).padStart(2,'0')}</span><i/></div><div className="audit-event-body"><div className="audit-event-top"><b>{l.action.replaceAll('_',' ')}</b><span>{l.entity}</span></div><p>{l.user?.email ?? 'System'}{l.entityId ? ` · reference ${l.entityId.slice(-8)}` : ''}</p><small>{new Intl.DateTimeFormat('en-NG',{dateStyle:'medium',timeStyle:'short'}).format(l.createdAt)}</small></div><div className="audit-event-mark">✓</div></div>) : <div className="admin-future-empty"><b>No audit activity</b><span>Administrative events will appear here.</span></div>}
    </section>
  </main></AppShell>;
}
