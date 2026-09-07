import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { ServiceRequestStatus } from '@prisma/client';
import { notifyUser } from '@/lib/notify';
import { sendServiceRequestConnectedEmail, sendServiceRequestCompletedEmail, sendServiceRequestDeclinedEmail } from '@/lib/email';

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

const STATUS_LABEL: Record<string, string> = {
  CSD_REVIEWING: 'Your request is now being reviewed by our Customer Service team.',
  AVAILABILITY_CONFIRMATION: "We're confirming the professional's availability for your request.",
  PROFESSIONAL_CONFIRMED: 'The professional has been confirmed and is ready for your job.',
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
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id },
    include: { customer: { include: { user: true } }, professional: { include: { user: true } } },
  });
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

  // Best-effort notifications — never let a bounced email or a failed
  // notification write undo the status change that already saved above.
  const link = `/dashboard/customer/service-requests/${serviceRequest.id}`;
  const customerUserId = serviceRequest.customer.userId;
  const customerEmail = serviceRequest.customer.user.email;
  const customerName = serviceRequest.customer.fullName;

  try {
    if (status === 'CONNECTED') {
      await notifyUser({ userId: customerUserId, type: 'service_request', title: "You're connected!", body: `${serviceRequest.professional.fullName} has been confirmed for your request.`, link });
      await notifyUser({ userId: serviceRequest.professional.userId, type: 'service_request', title: 'New connection', body: `You've been connected with ${customerName} for a service request.` });
      await sendServiceRequestConnectedEmail(customerEmail, customerName, serviceRequest.professional.fullName, serviceRequest.id);
    } else if (status === 'COMPLETED') {
      await notifyUser({ userId: customerUserId, type: 'service_request', title: 'Request completed', body: 'Your service request is complete. Leave a review!', link });
      await sendServiceRequestCompletedEmail(customerEmail, customerName, serviceRequest.id);
    } else if (status === 'DECLINED') {
      await notifyUser({ userId: customerUserId, type: 'service_request', title: 'Request declined', body: notes ?? 'We could not proceed with this request.', link });
      await sendServiceRequestDeclinedEmail(customerEmail, customerName, notes);
    } else if (STATUS_LABEL[status]) {
      // Lighter intermediate updates — in-app only, no email (avoids
      // spamming the customer's inbox for every CSD step).
      await notifyUser({ userId: customerUserId, type: 'service_request', title: 'Request update', body: STATUS_LABEL[status], link });
    }
  } catch (err) {
    console.error('[service-requests] notification/email failed:', err instanceof Error ? err.message : err);
  }

  return NextResponse.json({ ok: true, status });
}
