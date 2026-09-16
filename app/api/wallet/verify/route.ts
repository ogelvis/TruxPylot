import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applyWalletFunding } from '@/lib/wallet';
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  const reference = new URL(request.url).searchParams.get('reference');
  if (!reference) return NextResponse.json({ error: 'Missing reference.' }, { status: 400 });
  const funding = await prisma.walletFunding.findUnique({ where: { reference }, include: { wallet: { include: { professional: true } } } });
  if (!funding || funding.wallet.professional.userId !== session.userId) return NextResponse.json({ error: 'Funding not found.' }, { status: 404 });
  if (funding.status === 'SUCCESS') return NextResponse.json({ status: 'SUCCESS' });
  if (!process.env.PAYSTACK_SECRET_KEY) return NextResponse.json({ status: funding.status });
  const result = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } });
  const body = await result.json();
  if (result.ok && body?.data?.status === 'success') {
    const applied = await applyWalletFunding(reference, body.data.amount, String(body.data.id));
    if (applied.ok) return NextResponse.json({ status: 'SUCCESS' });
  }
  return NextResponse.json({ status: funding.status });
}
