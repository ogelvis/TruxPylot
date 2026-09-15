import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applySuccessfulInstantAdvertPayment } from '@/lib/advertising';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get('reference');
  if (!reference) return NextResponse.json({ error: 'Missing reference.' }, { status: 400 });
  const purchase = await prisma.instantAdvertPurchase.findUnique({ where: { reference } });
  if (!purchase) return NextResponse.json({ error: 'Advertising payment not found.' }, { status: 404 });
  if (purchase.status === 'SUCCESS') return NextResponse.json({ ok: true, active: true });

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'Payment provider is not configured.' }, { status: 503 });
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secret}` }, cache: 'no-store' });
  const body = await response.json();
  if (!response.ok || body?.data?.status !== 'success') return NextResponse.json({ ok: false, active: false }, { status: 202 });

  const amount = Number(body.data.amount);
  const result = await applySuccessfulInstantAdvertPayment(reference, amount, body.data.id != null ? String(body.data.id) : undefined);
  if (!result.ok) return NextResponse.json({ error: result.reason === 'amount_mismatch' ? 'Payment amount could not be verified.' : 'Payment could not be matched.' }, { status: 409 });
  return NextResponse.json({ ok: true, active: true });
}
