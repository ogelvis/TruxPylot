import { prisma } from '@/lib/prisma';

/** Creates one in-app notification. Callers wrap this in try/catch where
 *  it's a side effect of a more important action (a status change that
 *  already saved successfully) — a failed notification write should never
 *  undo or block the underlying action, same convention as lib/email.ts. */
export async function notifyUser(params: { userId: string; type: string; title: string; body: string; link?: string }) {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
    },
  });
}

/** Notifies every ADMIN user at once — used for events CSD staff should
 *  know about (e.g. a new service request awaiting review). Best-effort
 *  per user; one failed insert doesn't stop the others. */
export async function notifyAllAdmins(params: { type: string; title: string; body: string; link?: string }) {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
  await Promise.all(admins.map(admin =>
    notifyUser({ userId: admin.id, ...params }).catch(err => {
      console.error('[notify] failed for admin', admin.id, err instanceof Error ? err.message : err);
    })
  ));
}
