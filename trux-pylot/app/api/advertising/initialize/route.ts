import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { instantAdvertPlan, makeInstantAdvertReference } from '@/lib/advertising';

const input = z.object({ months: z.union([z.literal(1), z.literal(2), z.literal(3)]) });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Choose a valid advertising package.' }, { status: 400 });

  const professional = await prisma.professional.findUnique({ where: { userId: session.userId } });
  if (!professional) return NextResponse.json({ error: 'Professional profile not found.' }, { status: 404 });
  if (professional.verificationStatus !== 'APPROVED') return NextResponse.json({ error: 'Complete verification before purchasing an Instant Advert.' }, { status: 403 });

  const plan = instantAdvertPlan(parsed.data.months);
  if (!plan) return NextResponse.json({ error: 'Advertising package unavailable.' }, { status: 404 });

  const reference = makeInstantAdvertReference(professional.id);
  const purchase = await prisma.instantAdvertPurchase.create({
    data: {
      professionalId: professional.id,
      reference,
      durationMonths: plan.months,
      durationDays: plan.days,
      amount: plan.naira * 100,
      status: 'PENDING',
    },
  });

  try {
    const paystack = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: session.email,
        amount: purchase.amount,
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/advert-callback`,
        metadata: { feature: 'INSTANT_ADVERT', durationMonths: plan.months, professionalId: professional.id },
      }),
    });
    const body = await paystack.json();
    if (!paystack.ok || !body?.data?.authorization_url) throw new Error('Unable to initialize payment');
    return NextResponse.json({ authorizationUrl: body.data.authorization_url, reference });
  } catch (error) {
    await prisma.instantAdvertPurchase.update({ where: { id: purchase.id }, data: { status: 'FAILED' } });
    console.error('[advertising/initialize]', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Unable to initialize advertising payment.' }, { status: 502 });
  }
}
