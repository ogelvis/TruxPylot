import { prisma } from '@/lib/prisma';

type NotificationCategory = 'jobs' | 'messages' | 'payments' | 'announcements';
function categoryForType(type: string): NotificationCategory {
  const t = type.toLowerCase();
  if (t.includes('message')) return 'messages';
  if (t.includes('payment') || t.includes('wallet') || t.includes('withdraw') || t.includes('fund') || t.includes('reward') || t.includes('payout') || t.includes('transaction')) return 'payments';
  if (t.includes('job') || t.includes('booking') || t.includes('service')) return 'jobs';
  return 'announcements';
}

/** Creates one in-app notification. Preferences are respected, but important
 * financial records should still be emailed by their transaction workflow. */
export async function notifyUser(params: { userId: string; type: string; title: string; body: string; link?: string }) {
  const category = categoryForType(params.type);
  const securityCritical = params.type.toLowerCase().includes('security') || params.type.toLowerCase().includes('suspension') || params.type.toLowerCase().includes('password') || params.type.toLowerCase().includes('2fa');
  const prefs = await prisma.notificationPreference.upsert({ where: { userId: params.userId }, create: { userId: params.userId }, update: {} });
  if (!securityCritical && !prefs[category]) return;
  await prisma.notification.create({ data: { userId: params.userId, type: params.type, title: params.title, body: params.body, link: params.link } });
}

export async function notifyAllAdmins(params: { type: string; title: string; body: string; link?: string }) {
  const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }, select: { id: true } });
  await Promise.all(admins.map(admin => notifyUser({ userId: admin.id, ...params }).catch(err => console.error('[notify] failed for admin', admin.id, err instanceof Error ? err.message : err))));
}
