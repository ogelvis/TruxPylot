import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrCreateDedicatedAccount } from '@/lib/dedicated-account';
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  try {
    const account = await getOrCreateDedicatedAccount(session.userId, new URL(request.url).searchParams.get('refresh') === '1');
    if (!account) return NextResponse.json({ error: 'Professional profile not found.' }, { status: 404 });
    return NextResponse.json({ accountNumber: account.accountNumber, accountName: account.accountName, bankName: account.bankName, bankSlug: account.bankSlug, status: account.status, lastSyncedAt: account.lastSyncedAt });
  } catch { return NextResponse.json({ error: 'Bank transfer details are temporarily unavailable.' }, { status: 502 }); }
}
