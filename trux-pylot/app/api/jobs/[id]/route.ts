import { NextResponse } from 'next/server';
import { z } from 'zod';
import { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { canTransition } from '@/lib/jobs';

const input = z.discriminatedUnion('action', [
  z.object({ action: z.literal('quote'), amount: z.number().int().positive() }),
  z.object({ action: z.literal('proposal'), amount: z.number().int().positive(), priceType: z.enum(['FIXED', 'RANGE', 'HOURLY']), estimatedDuration: z.string().trim().max(120).optional(), availableAt: z.coerce.date().optional(), message: z.string().trim().min(10).max(1000), workDescription: z.string().trim().max(2000).optional() }),
  z.object({ action: z.literal('reject') }),
  z.object({ action: z.literal('accept') }),
  z.object({ action: z.literal('cancel') }),
  z.object({ action: z.literal('start') }),
  z.object({ action: z.literal('complete') }),
  z.object({ action: z.literal('confirm') }),
  z.object({ action: z.literal('accept_proposal'), quoteId: z.string().cuid() }),
  z.object({ action: z.literal('decline_proposal'), quoteId: z.string().cuid() }),
]);

const TARGET: Record<string, JobStatus> = {
  quote: 'QUOTED', proposal: 'QUOTED', reject: 'REJECTED', accept: 'ACCEPTED', cancel: 'CANCELLED',
  start: 'IN_PROGRESS', complete: 'COMPLETED', confirm: 'CUSTOMER_CONFIRMED',
};
const PROFESSIONAL_ACTIONS = new Set(['quote', 'proposal', 'reject', 'start', 'complete']);
const CUSTOMER_ACTIONS = new Set(['accept', 'cancel', 'confirm', 'accept_proposal', 'decline_proposal']);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });

  const { id } = await params;
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const { action } = parsed.data;

  const job = await prisma.job.findUnique({ where: { id }, include: { quotes: true } });
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

  if (action === 'accept_proposal' || action === 'decline_proposal') {
    if (session.role !== 'CUSTOMER') return NextResponse.json({ error: 'Only the customer can decide on a proposal.' }, { status: 403 });
    const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
    if (!customer || job.customerId !== customer.id) return NextResponse.json({ error: 'This is not your job request.' }, { status: 403 });
    const quote = job.quotes.find(item => item.id === parsed.data.quoteId);
    if (!quote || quote.status !== 'PENDING') return NextResponse.json({ error: 'Proposal not found or already decided.' }, { status: 404 });
    await prisma.$transaction(async tx => {
      await tx.quote.update({ where: { id: quote.id }, data: { status: action === 'accept_proposal' ? 'ACCEPTED' : 'DECLINED' } });
      if (action === 'accept_proposal') {
        await tx.quote.updateMany({ where: { jobId: job.id, id: { not: quote.id }, status: 'PENDING' }, data: { status: 'DECLINED' } });
        await tx.job.update({ where: { id: job.id }, data: { status: 'ACCEPTED' } });
      }
    });
    return NextResponse.json({ ok: true, status: action === 'accept_proposal' ? 'ACCEPTED' : job.status });
  }

  const targetStatus = TARGET[action];
  if (!canTransition(job.status, targetStatus)) {
    return NextResponse.json({
      error: `This job can't be updated that way from its current status (${job.status.replaceAll('_', ' ').toLowerCase()}).`,
    }, { status: 409 });
  }

  if (parsed.data.action === 'quote' || parsed.data.action === 'proposal') {
    await prisma.quote.create({ data: { jobId: job.id, amount: parsed.data.amount, ...(parsed.data.action === 'proposal' ? { priceType: parsed.data.priceType, estimatedDuration: parsed.data.estimatedDuration, availableAt: parsed.data.availableAt, message: parsed.data.message, workDescription: parsed.data.workDescription } : {}) } });
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
