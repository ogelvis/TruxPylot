import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const actionSchema = z.object({ id: z.string().cuid(), action: z.enum(['approve', 'reject', 'pay']), reason: z.string().max(300).optional() });
async function admin() { const s = await getSession(); return s?.role === 'ADMIN' ? s : null; }

export async function GET() {
  if (!await admin()) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const [referrals, rewards, withdrawals] = await Promise.all([
    prisma.referral.findMany({ include: { referrer: { select: { email: true } }, referred: { select: { email: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.reward.findMany({ include: { user: { select: { email: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.withdrawal.findMany({ include: { user: { select: { email: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }),
  ]);
  return NextResponse.json({ referrals, rewards, withdrawals });
}

export async function PATCH(request: Request) {
  const session = await admin();
  if (!session) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid review action.' }, { status: 400 });
  const { id, action, reason } = parsed.data;
  if (action === 'pay' || action === 'approve') {
    const reward = await prisma.reward.update({ where: { id }, data: { status: action === 'pay' ? 'PAID' : 'APPROVED', approvedById: session.userId, paidAt: action === 'pay' ? new Date() : undefined } });
    await prisma.auditLog.create({ data: { userId: session.userId, action: `REFERRAL_REWARD_${action.toUpperCase()}`, entity: 'Reward', entityId: id } });
    return NextResponse.json({ ok: true, reward });
  }
  const reward = await prisma.reward.update({ where: { id }, data: { status: 'VOID', reason: reason || 'Rejected by admin', approvedById: session.userId } });
  await prisma.auditLog.create({ data: { userId: session.userId, action: 'REFERRAL_REWARD_REJECTED', entity: 'Reward', entityId: id, data: { reason } } });
  return NextResponse.json({ ok: true, reward });
}
