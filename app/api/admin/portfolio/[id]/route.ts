import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const input = z.object({ action: z.enum(['APPROVE', 'REJECT']) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Admin permission required.' }, { status: 403 });

  const { id } = await params;
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const post = await prisma.portfolioItem.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

  if (parsed.data.action === 'APPROVE') {
    await prisma.portfolioItem.update({ where: { id }, data: { approved: true } });
  } else {
    // No separate "rejected" state exists yet — a rejected post is removed
    // so the professional can re-upload a corrected version if they choose.
    await prisma.portfolioItem.delete({ where: { id } });
  }

  await prisma.auditLog.create({
    data: { userId: session.userId, action: `PORTFOLIO_POST_${parsed.data.action}D`, entity: 'PortfolioItem', entityId: id },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
