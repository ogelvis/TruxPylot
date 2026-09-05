import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { VerificationStatus } from '@prisma/client';
import { sendVerificationApprovedEmail, sendVerificationRejectedEmail, sendVerificationMoreInfoEmail } from '@/lib/email';

const input = z
  .object({
    action: z.enum(['MARK_UNDER_REVIEW', 'APPROVE', 'REJECT', 'REQUEST_MORE_INFORMATION']),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine(
    (d) => (d.action !== 'REJECT' && d.action !== 'REQUEST_MORE_INFORMATION') || !!d.notes,
    { message: 'Notes are required to reject or request more information.', path: ['notes'] }
  );

// Target status for each admin action.
const NEXT_STATUS: Record<z.infer<typeof input>['action'], VerificationStatus> = {
  MARK_UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVE: 'APPROVED',
  REJECT: 'REJECTED',
  REQUEST_MORE_INFORMATION: 'MORE_INFO_REQUIRED',
};

// Which current statuses each action may be applied from. Anything else
// (already APPROVED/REJECTED/MORE_INFO_REQUIRED, or an unexpected value)
// is treated as "already reviewed" / not a valid transition.
const ALLOWED_FROM: Record<z.infer<typeof input>['action'], VerificationStatus[]> = {
  MARK_UNDER_REVIEW: ['SUBMITTED'],
  APPROVE: ['SUBMITTED', 'UNDER_REVIEW'],
  REJECT: ['SUBMITTED', 'UNDER_REVIEW'],
  REQUEST_MORE_INFORMATION: ['SUBMITTED', 'UNDER_REVIEW'],
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin permission required.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const parsed = input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid verification action.' }, { status: 400 });
  }
  const { action, notes } = parsed.data;

  const { id } = await params;
  const requestItem = await prisma.verificationRequest.findUnique({
    where: { id },
    include: { professional: { include: { user: true } } },
  });
  if (!requestItem) {
    return NextResponse.json({ error: 'Verification request not found.' }, { status: 404 });
  }

  if (!ALLOWED_FROM[action].includes(requestItem.status)) {
    return NextResponse.json(
      { error: `This request is already ${requestItem.status.toLowerCase().replaceAll('_', ' ')} and can't be updated with that action.` },
      { status: 409 }
    );
  }

  const status = NEXT_STATUS[action];

  try {
    await prisma.$transaction([
      prisma.verificationRequest.update({
        where: { id },
        data: { status, notes, reviewedAt: new Date() },
      }),
      prisma.professional.update({
        where: { id: requestItem.professionalId },
        data: { verificationStatus: status },
      }),
      prisma.auditLog.create({
        data: {
          userId: session.userId,
          action,
          entity: 'VerificationRequest',
          entityId: id,
          data: { previousStatus: requestItem.status, newStatus: status, notes: notes ?? null },
        },
      }),
    ]);
  } catch (err) {
    console.error('[admin/verifications] update failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Could not save this review right now. Please try again.' }, { status: 500 });
  }

  // Best-effort notification — a bounced/misconfigured email should never
  // undo the review decision that already saved successfully above.
  try {
    const to = requestItem.professional.user.email;
    const name = requestItem.professional.fullName;
    if (action === 'APPROVE') await sendVerificationApprovedEmail(to, name);
    else if (action === 'REJECT') await sendVerificationRejectedEmail(to, name, notes);
    else if (action === 'REQUEST_MORE_INFORMATION') await sendVerificationMoreInfoEmail(to, name, notes);
  } catch (err) {
    console.error('[admin/verifications] notification email failed:', err instanceof Error ? err.message : err);
  }

  return NextResponse.json({ ok: true, status });
}
