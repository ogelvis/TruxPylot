import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { DvaPhoneRequiredError, getOrCreateDedicatedAccount } from '@/lib/dedicated-account';
import { reconcileDedicatedAccountTransfers } from '@/lib/wallet';
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  try {
    const params = new URL(request.url).searchParams;
    const account = await getOrCreateDedicatedAccount(
      session.userId,
      params.get('refresh') === '1',
      params.get('check') === '1',
    );
    if (!account) return NextResponse.json({ error: 'Professional profile not found.' }, { status: 404 });
    if (params.get('check') === '1' && account.id && account.accountNumber) {
      try {
        const reconciliation = await reconcileDedicatedAccountTransfers(account.id);
        console.info('[DVA CHECK] reconciliation complete', {
          accountId: account.id,
          ...reconciliation,
        });
      } catch (error) {
        console.warn('[DVA CHECK] reconciliation failed', error instanceof Error ? error.message : 'unknown');
      }
    }

    if (account.status === 'AWAITING_PHONE') {
      return NextResponse.json({
        error: 'Add your phone number to your professional profile before we can create your bank transfer account.',
        code: 'DVA_PHONE_REQUIRED',
        status: account.status,
      }, { status: 422 });
    }
    return NextResponse.json({ accountNumber: account.accountNumber, accountName: account.accountName, bankName: account.bankName, bankSlug: account.bankSlug, status: account.status, lastSyncedAt: account.lastSyncedAt });
  } catch (error) {
    if (error instanceof DvaPhoneRequiredError) {
      return NextResponse.json({
        error: 'Add your phone number to your professional profile before we can create your bank transfer account.',
        code: 'DVA_PHONE_REQUIRED',
        status: 'AWAITING_PHONE',
      }, { status: 422 });
    }
    console.error('[DVA API] failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Bank transfer details are temporarily unavailable.' }, { status: 502 });
  }
}
