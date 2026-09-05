import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { applySuccessfulPremiumPayment } from '@/lib/payments';

/** GET /api/payments/premium/verify?reference=TP-PREM-xxx
 *  Fallback path for the premium-callback page, exactly like
 *  app/api/payments/verify for jobs: the Paystack webhook is the primary,
 *  trusted path; this exists only because webhook delivery can lag a few
 *  seconds. It never trusts the browser's claim of success — it always
 *  asks Paystack directly, server-side, before activating anything. */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') {
    return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  }

  const reference = new URL(request.url).searchParams.get('reference');
  if (!reference) return NextResponse.json({ error: 'Missing reference.' }, { status: 400 });

  const purchase = await prisma.premiumPurchase.findUnique({ where: { reference }, include: { professional: true } });
  if (!purchase) return NextResponse.json({ error: 'Purchase not found.' }, { status: 404 });
  if (purchase.professional.userId !== session.userId) {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  }

  if (purchase.status === 'SUCCESS') {
    return NextResponse.json({ status: 'SUCCESS' });
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ status: purchase.status });

  try {
    const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = await r.json();
    if (r.ok && body?.data?.status === 'success') {
      const result = await applySuccessfulPremiumPayment(reference, body.data.amount, body.data.id);
      if (result.ok) return NextResponse.json({ status: 'SUCCESS' });
    }
  } catch (err) {
    console.error('[payments/premium/verify] Paystack verify call failed:', err instanceof Error ? err.message : err);
  }

  return NextResponse.json({ status: purchase.status });
}
