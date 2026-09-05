import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { makePremiumReference, premiumPriceKobo } from '@/lib/payments';

// POST /api/payments/premium/initialize
// Starts a one-time Premium tier purchase for the signed-in professional.
// Mirrors app/api/payments/initialize/route.ts (the existing job payment
// flow) but is intentionally its own route: there is no Job/Quote involved,
// and a professional — not a customer — is paying.
export async function POST() {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') {
    return NextResponse.json({ error: 'Professional sign-in required' }, { status: 401 });
  }

  const professional = await prisma.professional.findUnique({ where: { userId: session.userId } });
  if (!professional) return NextResponse.json({ error: 'Professional profile not found' }, { status: 404 });

  // Premium sits after Verified in the tier journey (Basic → Verified →
  // Premium) — a professional completes verification first, then unlocks
  // the option to purchase Premium. Verified and Premium remain
  // independent states once reached (see lib/payments.ts /
  // applySuccessfulPremiumPayment): this check only gates *starting* a
  // purchase, it never grants or implies either status from the other.
  if (professional.verificationStatus !== 'APPROVED') {
    return NextResponse.json({ error: 'Complete verification before purchasing Premium.' }, { status: 403 });
  }

  const existingSuccess = await prisma.premiumPurchase.findFirst({
    where: { professionalId: professional.id, status: 'SUCCESS' },
  });
  if (existingSuccess) {
    return NextResponse.json({ error: 'Premium has already been activated on this account.' }, { status: 409 });
  }

  const amount = premiumPriceKobo();
  const reference = makePremiumReference(professional.id);
  const purchase = await prisma.premiumPurchase.create({
    data: { professionalId: professional.id, reference, amount, status: 'PENDING' },
  });

  const paystack = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: session.email,
      amount,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/premium-callback`,
    }),
  });
  const body = await paystack.json();
  if (!paystack.ok) {
    await prisma.premiumPurchase.delete({ where: { id: purchase.id } });
    return NextResponse.json({ error: 'Unable to initialize payment' }, { status: 502 });
  }

  return NextResponse.json({ authorizationUrl: body.data.authorization_url, reference });
}
