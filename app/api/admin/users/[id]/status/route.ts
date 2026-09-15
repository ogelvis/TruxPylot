import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyUser } from '@/lib/notify';
import { sendNotificationEmail } from '@/lib/email';

const DURATION_DAYS: Record<string, number | null> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  indefinite: null,
};

const input = z.object({
  action: z.enum(['SUSPEND', 'BLOCK', 'REACTIVATE']),
  reason: z.string().max(500).optional(),
  duration: z.enum(['24h', '7d', '30d', 'indefinite']).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
  }
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  if (parsed.data.action !== 'REACTIVATE' && !parsed.data.reason) {
    return NextResponse.json({ error: 'A reason is required.' }, { status: 400 });
  }

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (target.role === 'ADMIN' || target.role === 'SUPER_ADMIN') return NextResponse.json({ error: 'Cannot modify another admin from this panel.' }, { status: 403 });

  let data: { status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED'; suspendedUntil: Date | null; suspensionReason: string | null };

  if (parsed.data.action === 'REACTIVATE') {
    data = { status: 'ACTIVE', suspendedUntil: null, suspensionReason: null };
  } else if (parsed.data.action === 'BLOCK') {
    data = { status: 'BLOCKED', suspendedUntil: null, suspensionReason: parsed.data.reason ?? null };
  } else {
    const days = parsed.data.duration ? DURATION_DAYS[parsed.data.duration] : null;
    data = {
      status: 'SUSPENDED',
      suspendedUntil: days ? new Date(Date.now() + days * 86400000) : null,
      suspensionReason: parsed.data.reason ?? null,
    };
  }

  await prisma.$transaction(async tx => {
    await tx.user.update({ where: { id }, data });
    if (parsed.data.action === 'REACTIVATE') {
      await tx.accountSuspension.updateMany({ where: { userId: id, status: { in: ['PENDING_REVIEW','ACTIVE'] } }, data: { status: 'RESTORED', reviewedAt: new Date(), reviewedById: session.userId, restoredAt: new Date(), restoredById: session.userId, reviewNote: parsed.data.reason ?? 'Restored by administrator' } });
    } else {
      await tx.accountSuspension.create({ data: { userId: id, status: 'ACTIVE', reason: parsed.data.reason ?? 'Administrative suspension', source: 'ADMIN', reviewedAt: new Date(), reviewedById: session.userId, reviewNote: parsed.data.reason ?? null } });
    }
    await tx.auditLog.create({ data: { userId: session.userId, action: parsed.data.action, entity: 'User', entityId: id, data: { reason: parsed.data.reason ?? null, duration: parsed.data.duration ?? null } } });
  });

  if (parsed.data.action === 'REACTIVATE') { await notifyUser({ userId: id, type: 'SECURITY_ACCOUNT_RESTORED', title: 'Your TruxPylot account was restored', body: 'An administrator reviewed your account and restored access.', link: '/login' }).catch(()=>{}); try { await sendNotificationEmail({ to: target.email, subject: 'TruxPylot account restored', title: 'Your account was restored', body: 'An administrator reviewed your account and restored access. You can sign in again.' }); } catch {} }
  return NextResponse.json({ ok: true, status: data.status });
}
