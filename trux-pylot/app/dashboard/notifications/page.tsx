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
  const name = user.professional?.fullName ?? user.customer?.fullName ?? user.email;
  const avatar = user.professional?.avatarUrl ?? user.customer?.avatarUrl;
  return <AppShell role={session.role} name={name} avatarUrl={avatar} active="/dashboard/notifications">
    <main className="dash-page">
      <div className="overview-top"><div><h1>Notifications.</h1><p className="subcopy">Your account activity, messages, payments and important updates.</p></div><Link className="secondary" href={session.role === 'PROFESSIONAL' ? '/dashboard/professional' : '/dashboard/customer'}>Back to dashboard</Link></div>
      <section className="panel"><div className="panel-head"><div><h2>Notification center</h2><p>Recent updates are kept here for your records.</p></div></div>
        <div className="notif-page-list">{notifications.length ? notifications.map(n => <Link key={n.id} href={n.link ?? '#'} className={'notif-page-item' + (!n.readAt ? ' unread' : '')}><b>{n.title}</b><span>{n.body}</span><small>{new Intl.DateTimeFormat('en-NG',{dateStyle:'medium',timeStyle:'short'}).format(n.createdAt)}{!n.readAt ? ' · New' : ''}</small></Link>) : <div className="empty">No notifications yet.</div>}</div>
      </section>
    </main>
  </AppShell>;
}
