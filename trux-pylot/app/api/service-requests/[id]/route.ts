import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { ServiceRequestStatus } from '@prisma/client';

const input = z
  .object({
    action: z.enum(['MARK_REVIEWING', 'CONFIRM_AVAILABILITY', 'CONFIRM_PROFESSIONAL', 'MARK_CONNECTED', 'MARK_COMPLETED', 'DECLINE', 'CANCEL']),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((d) => d.action !== 'DECLINE' || !!d.notes, { message: 'Add a reason before declining a request.', path: ['notes'] });

const CSD_ACTIONS = new Set(['MARK_REVIEWING', 'CONFIRM_AVAILABILITY', 'CONFIRM_PROFESSIONAL', 'MARK_CONNECTED', 'MARK_COMPLETED', 'DECLINE']);

const NEXT_STATUS: Record<string, ServiceRequestStatus> = {
  MARK_REVIEWING: 'CSD_REVIEWING',
  CONFIRM_AVAILABILITY: 'AVAILABILITY_CONFIRMATION',
  CONFIRM_PROFESSIONAL: 'PROFESSIONAL_CONFIRMED',
  MARK_CONNECTED: 'CONNECTED',
  MARK_COMPLETED: 'COMPLETED',
  DECLINE: 'DECLINED',
  CANCEL: 'CANCELLED',
};

// Which current statuses each action may run from.
const ALLOWED_FROM: Record<string, ServiceRequestStatus[]> = {
  MARK_REVIEWING: ['SUBMITTED'],
  CONFIRM_AVAILABILITY: ['CSD_REVIEWING'],
  CONFIRM_PROFESSIONAL: ['AVAILABILITY_CONFIRMATION'],
  MARK_CONNECTED: ['PROFESSIONAL_CONFIRMED'],
  MARK_COMPLETED: ['CONNECTED'],
  DECLINE: ['SUBMITTED', 'CSD_REVIEWING', 'AVAILABILITY_CONFIRMATION', 'PROFESSIONAL_CONFIRMED'],
  // A customer can only back out before CSD has actually confirmed and
  // connected the professional — after that, cancellation is a CSD/admin
  // matter (via DECLINE), since a real-world commitment is already in motion.
  CANCEL: ['SUBMITTED', 'CSD_REVIEWING', 'AVAILABILITY_CONFIRMATION'],
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });

  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  }
  const { action, notes } = parsed.data;

  const { id } = await params;
  const serviceRequest = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!serviceRequest) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });

  if (CSD_ACTIONS.has(action)) {
    if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Only Truxpylot Customer Service can do this.' }, { status: 403 });
  } else {
    // CANCEL — customer-only, and only their own request.
    if (session.role !== 'CUSTOMER') return NextResponse.json({ error: 'Only the customer who made this request can cancel it.' }, { status: 403 });
    const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
    if (!customer || serviceRequest.customerId !== customer.id) {
      return NextResponse.json({ error: 'This is not your request.' }, { status: 403 });
    }
  }

  if (!ALLOWED_FROM[action].includes(serviceRequest.status)) {
    return NextResponse.json({
      error: `This request can't be updated that way from its current status (${serviceRequest.status.replaceAll('_', ' ').toLowerCase()}).`,
    }, { status: 409 });
  }

  const status = NEXT_STATUS[action];
  await prisma.serviceRequest.update({
    where: { id },
    data: { status, csdNotes: notes ?? serviceRequest.csdNotes },
  });

  return NextResponse.json({ ok: true, status });
}
