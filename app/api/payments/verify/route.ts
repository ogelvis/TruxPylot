import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { applySuccessfulPayment } from '@/lib/payments';

/** GET /api/payments/verify?reference=TP-xxx
 *  Called by the payment callback page after Paystack redirects the
 *  browser back. The webhook (app/api/payments/paystack/webhook) is the
 *  primary, trusted path that activates a job — this route exists only
 *  because webhook delivery can lag by a few seconds, and we don't want
 *  the person staring at "pending" if it already succeeded. It NEVER
 *  trusts the browser's claim that payment succeeded: it always asks
 *  Paystack directly, server-side, before touching anything. */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign-in required.' }, { status: 401 });

  const reference = new URL(request.url).searchParams.get('reference');
  if (!reference) return NextResponse.json({ error: 'Missing reference.' }, { status: 400 });

  const payment = await prisma.payment.findUnique({ where: { reference }, include: { job: true } });
  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });

  // Only the customer who owns this job's payment may check its status.
  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer || payment.job.customerId !== customer.id) {
    return NextResponse.json({ error: 'Not permitted.' }, { status: 403 });
  }

  if (payment.status === 'SUCCESS') {
    return NextResponse.json({ status: 'SUCCESS', jobId: payment.jobId });
  }

  // Not marked SUCCESS in our DB yet — ask Paystack directly rather than
  // trusting anything the client sent.
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ status: payment.status });

  try {
    const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = await r.json();
    if (r.ok && body?.data?.status === 'success') {
      const result = await applySuccessfulPayment(reference, body.data.amount, body.data.id);
      if (result.ok) return NextResponse.json({ status: 'SUCCESS', jobId: payment.jobId });
    }
  } catch (err) {
    console.error('[payments/verify] Paystack verify call failed:', err instanceof Error ? err.message : err);
  }

  return NextResponse.json({ status: payment.status, jobId: payment.jobId });
}
