import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/app-shell';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session || !['CUSTOMER','PROFESSIONAL'].includes(session.role)) redirect('/login');
  const user = await prisma.user.findUnique({ where: { id: session.userId }, include: { professional: true, customer: true } });
  if (!user) return null;
  const notifications = await prisma.notification.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' }, take: 100 });
  const unread = notifications.filter(n => !n.readAt).length;
  const name = user.professional?.fullName ?? user.customer?.fullName ?? user.email;
  const avatar = user.professional?.avatarUrl ?? user.customer?.avatarUrl;
  return <AppShell role={session.role} name={name} avatarUrl={avatar} active="/dashboard/notifications">
    <main className="dash-page futuristic-notifications">
      <section className="signal-hero">
        <div className="signal-orbit signal-orbit-a"/><div className="signal-orbit signal-orbit-b"/>
        <div className="signal-hero-copy"><p className="signal-kicker">TRUXPYLOT / SIGNAL CENTER</p><h1>Your updates, <em>in one place.</em></h1><p>Jobs, messages, payments, security alerts and important platform updates — without the clutter.</p></div>
        <div className="signal-counter"><span>UNREAD</span><strong>{unread.toString().padStart(2,'0')}</strong><small>live notifications</small></div>
      </section>
      <div className="signal-toolbar"><div><span className="signal-dot"/> Activity feed</div><Link href={session.role === 'PROFESSIONAL' ? '/dashboard/professional' : '/dashboard/customer'}>Return to overview →</Link></div>
      <section className="signal-feed">
        {notifications.length ? notifications.map((n,i) => <Link key={n.id} href={n.link ?? '#'} className={'signal-item' + (!n.readAt ? ' is-new' : '')}>
          <span className="signal-index">{String(i+1).padStart(2,'0')}</span><span className="signal-icon">{!n.readAt ? '●' : '○'}</span>
          <div><div className="signal-item-top"><b>{n.title}</b>{!n.readAt && <span>NEW</span>}</div><p>{n.body}</p><small>{new Intl.DateTimeFormat('en-NG',{dateStyle:'medium',timeStyle:'short'}).format(n.createdAt)}</small></div><span className="signal-arrow">↗</span>
        </Link>) : <div className="signal-empty"><strong>All quiet.</strong><span>When something important happens, it will appear here.</span></div>}
      </section>
    </main>
  </AppShell>;
}
