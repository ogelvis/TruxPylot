import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/auth';
import { sendEmailOtp, normalizeEmail, describeOtpError } from '@/lib/otp';
import { writeAuditLog } from '@/lib/audit';

const input = z.object({
  email: z.string().email().transform(normalizeEmail),
  role: z.enum(['EDITOR', 'OPERATOR']),
  fullName: z.string().min(2).max(120),
});

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: 'Super Admin permission required.' }, { status: 403 });

  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid staff invitation.' }, { status: 400 });
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return NextResponse.json({ error: 'That email already has an account. Change the role from the staff management workflow instead.' }, { status: 409 });

  try {
    await sendEmailOtp(parsed.data.email, {
      shouldCreateUser: true,
      data: { role: parsed.data.role, fullName: parsed.data.fullName },
    });
    await writeAuditLog({
      userId: session.userId,
      action: 'STAFF_INVITE_SENT',
      entity: 'User',
      data: { role: parsed.data.role },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const details = describeOtpError(err);
    console.error('[staff/invite]', details);
    return NextResponse.json({ error: 'Could not send the staff invitation right now.' }, { status: 502 });
  }
}
