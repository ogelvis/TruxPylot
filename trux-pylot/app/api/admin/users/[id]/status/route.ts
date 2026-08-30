import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
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
  if (target.role === 'ADMIN') return NextResponse.json({ error: 'Cannot modify another admin from this panel.' }, { status: 403 });

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

  await prisma.$transaction([
    prisma.user.update({ where: { id }, data }),
    prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: parsed.data.action,
        entity: 'User',
        entityId: id,
        data: { reason: parsed.data.reason ?? null, duration: parsed.data.duration ?? null },
      },
    }),
  ]);

  return NextResponse.json({ ok: true, status: data.status });
}
