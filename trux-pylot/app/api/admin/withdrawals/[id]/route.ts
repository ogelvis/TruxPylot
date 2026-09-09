import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { processWalletWithdrawal, rejectWalletWithdrawal, finalizeWalletWithdrawal } from '@/lib/withdrawals';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const action = String(body?.action ?? '');
  try {
    if (action === 'approve') return NextResponse.json({ ok: true, result: await processWalletWithdrawal(id, session.userId) });
    if (action === 'reject') {
      await rejectWalletWithdrawal(id, session.userId, String(body?.reason ?? ''));
      return NextResponse.json({ ok: true });
    }
    if (action === 'finalize') {
      const otp = String(body?.otp ?? '').trim();
      if (!/^\d{4,8}$/.test(otp)) return NextResponse.json({ error: 'Enter the transfer OTP.' }, { status: 400 });
      return NextResponse.json({ ok: true, result: await finalizeWalletWithdrawal(id, otp, session.userId) });
    }
    return NextResponse.json({ error: 'Unsupported withdrawal action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Withdrawal action failed.' }, { status: 409 });
  }
}
