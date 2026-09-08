import { NextResponse } from 'next/server';
import { z } from 'zod';
import { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { canTransition } from '@/lib/jobs';
import { sendNotificationEmail } from '@/lib/email';
import { qualifyReferral } from '@/lib/referrals';

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
  const payload = parsed.data;
  const { action } = payload;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      quotes: true,
      customer: { select: { userId: true, user: { select: { email: true } } } },
      professional: { select: { userId: true, user: { select: { email: true } } } },
    },
  });
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

  if (payload.action === 'accept_proposal' || payload.action === 'decline_proposal') {
    if (session.role !== 'CUSTOMER') return NextResponse.json({ error: 'Only the customer can decide on a proposal.' }, { status: 403 });
    const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
    if (!customer || job.customerId !== customer.id) return NextResponse.json({ error: 'This is not your job request.' }, { status: 403 });
    const quote = job.quotes.find(item => item.id === payload.quoteId);
    if (!quote || quote.status !== 'PENDING') return NextResponse.json({ error: 'Proposal not found or already decided.' }, { status: 404 });
    await prisma.$transaction(async tx => {
      await tx.quote.update({ where: { id: quote.id }, data: { status: payload.action === 'accept_proposal' ? 'ACCEPTED' : 'DECLINED' } });
      if (payload.action === 'accept_proposal') {
        await tx.quote.updateMany({ where: { jobId: job.id, id: { not: quote.id }, status: 'PENDING' }, data: { status: 'DECLINED' } });
        await tx.job.update({ where: { id: job.id }, data: { status: 'ACCEPTED' } });
      }
    });
    if (job.professional?.userId) {
      await prisma.notification.create({
        data: {
          userId: job.professional.userId,
          type: 'proposal',
          title: payload.action === 'accept_proposal' ? 'Proposal accepted' : 'Proposal declined',
          body: payload.action === 'accept_proposal'
            ? 'The customer accepted your proposal.'
            : 'The customer declined your proposal.',
          link: `/dashboard/professional/jobs/${job.id}`,
        },
      });
      sendNotificationEmail({
        to: job.professional.user.email,
        subject: payload.action === 'accept_proposal' ? 'Your Trux Pylot proposal was accepted' : 'Your Trux Pylot proposal was declined',
        title: payload.action === 'accept_proposal' ? 'Proposal accepted' : 'Proposal declined',
        body: payload.action === 'accept_proposal' ? 'The customer accepted your proposal.' : 'The customer declined your proposal.',
        link: `/dashboard/professional/jobs/${job.id}`,
      }).catch(error => console.error('[jobs] proposal email failed:', error instanceof Error ? error.message : error));
    }
    return NextResponse.json({ ok: true, status: payload.action === 'accept_proposal' ? 'ACCEPTED' : job.status });
  }

  const targetStatus = TARGET[action];
  if (!canTransition(job.status, targetStatus)) {
    return NextResponse.json({
      error: `This job can't be updated that way from its current status (${job.status.replaceAll('_', ' ').toLowerCase()}).`,
    }, { status: 409 });
  }

  if (payload.action === 'quote' || payload.action === 'proposal') {
    const quoteData = payload.action === 'proposal'
      ? {
          jobId: job.id,
          amount: payload.amount,
          priceType: payload.priceType,
          estimatedDuration: payload.estimatedDuration,
          availableAt: payload.availableAt,
          message: payload.message,
          workDescription: payload.workDescription,
        }
      : { jobId: job.id, amount: payload.amount };
    await prisma.quote.create({ data: quoteData });
    await prisma.job.update({ where: { id: job.id }, data: { status: targetStatus } });
    if (payload.action === 'proposal') {
      await prisma.notification.create({
        data: {
          userId: job.customer.userId,
          type: 'proposal',
          title: 'New proposal received',
          body: 'A professional has sent a proposal for your job.',
          link: `/dashboard/customer/jobs/${job.id}`,
        },
      });
      sendNotificationEmail({
        to: job.customer.user.email,
        subject: 'New Trux Pylot proposal received',
        title: 'New proposal received',
        body: 'A professional has sent a proposal for your job.',
        link: `/dashboard/customer/jobs/${job.id}`,
      }).catch(error => console.error('[jobs] proposal email failed:', error instanceof Error ? error.message : error));
    }
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
    if (job.customer?.userId) {
      await qualifyReferral(job.customer.userId).catch(error =>
        console.error('[jobs] referral qualification failed:', error instanceof Error ? error.message : error),
      );
    }
  } else {
    await prisma.job.update({ where: { id: job.id }, data: { status: targetStatus } });
  }

  return NextResponse.json({ ok: true, status: action === 'confirm' ? 'SETTLED' : targetStatus });
}
