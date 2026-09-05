import { NextResponse } from 'next/server';
import { z } from 'zod';
import { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { canTransition } from '@/lib/jobs';

const input = z.discriminatedUnion('action', [
  z.object({ action: z.literal('quote'), amount: z.number().int().positive() }),
  z.object({ action: z.literal('reject') }),
  z.object({ action: z.literal('accept') }),
  z.object({ action: z.literal('cancel') }),
  z.object({ action: z.literal('start') }),
  z.object({ action: z.literal('complete') }),
  z.object({ action: z.literal('confirm') }),
]);

const TARGET: Record<string, JobStatus> = {
  quote: 'QUOTED', reject: 'REJECTED', accept: 'ACCEPTED', cancel: 'CANCELLED',
  start: 'IN_PROGRESS', complete: 'COMPLETED', confirm: 'CUSTOMER_CONFIRMED',
};
const PROFESSIONAL_ACTIONS = new Set(['quote', 'reject', 'start', 'complete']);
const CUSTOMER_ACTIONS = new Set(['accept', 'cancel', 'confirm']);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });

  const { id } = await params;
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const { action } = parsed.data;

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

  if (PROFESSIONAL_ACTIONS.has(action)) {
    if (session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Only the assigned professional can do this.' }, { status: 403 });
    const professional = await prisma.professional.findUnique({ where: { userId: session.userId } });
    if (!professional || job.professionalId !== professional.id) {
      return NextResponse.json({ error: 'This job is not assigned to you.' }, { status: 403 });
    }
  } else if (CUSTOMER_ACTIONS.has(action)) {
    if (session.role !== 'CUSTOMER') return NextResponse.json({ error: 'Only the customer who made this request can do this.' }, { status: 403 });
    const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
    if (!customer || job.customerId !== customer.id) {
      return NextResponse.json({ error: 'This is not your job request.' }, { status: 403 });
    }
  }

  const targetStatus = TARGET[action];
  if (!canTransition(job.status, targetStatus)) {
    return NextResponse.json({
      error: `This job can't be updated that way from its current status (${job.status.replaceAll('_', ' ').toLowerCase()}).`,
    }, { status: 409 });
  }

  if (parsed.data.action === 'quote') {
    await prisma.quote.create({ data: { jobId: job.id, amount: parsed.data.amount } });
    await prisma.job.update({ where: { id: job.id }, data: { status: targetStatus } });
  } else if (action === 'confirm') {
    // Confirming completion is also the moment a professional's pending
    // balance becomes available to withdraw — there's no separate manual
    // payout step yet (real bank transfers are a later phase), so we move
    // the job straight to SETTLED and release the wallet balance together.
    await prisma.$transaction(async tx => {
      await tx.job.update({ where: { id: job.id }, data: { status: 'CUSTOMER_CONFIRMED' } });
      const payment = await tx.payment.findUnique({ where: { jobId: job.id } });
      if (job.professionalId && payment) {
        const net = payment.amount - payment.commission;
        await tx.wallet.update({
          where: { professionalId: job.professionalId },
          data: { pendingBalance: { decrement: net }, availableBalance: { increment: net } },
        });
        await tx.professional.update({ where: { id: job.professionalId }, data: { completedJobs: { increment: 1 } } });
      }
      await tx.job.update({ where: { id: job.id }, data: { status: 'SETTLED' } });
    });
  } else {
    await prisma.job.update({ where: { id: job.id }, data: { status: targetStatus } });
  }

  return NextResponse.json({ ok: true, status: action === 'confirm' ? 'SETTLED' : targetStatus });
}
