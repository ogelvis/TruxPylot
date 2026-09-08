import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { walletReference } from '@/lib/wallet';

const input = z.object({ amount: z.number().int().min(10000).max(500000000) });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') {
    return NextResponse.json({ error: 'Professional sign-in required.' }, { status: 401 });
  }
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Funding amount must be at least ₦100.' }, { status: 400 });
  }
  const professional = await prisma.professional.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!professional) return NextResponse.json({ error: 'Professional profile not found.' }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || !/^https?:\/\/[^/]+/i.test(appUrl) || !process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: 'Wallet funding is not configured yet. Please contact support.' }, { status: 503 });
  }

  const wallet = await prisma.wallet.upsert({ where: { professionalId: professional.id }, create: { professionalId: professional.id }, update: {} });
  const reference = walletReference('FUND');
  await prisma.walletFunding.create({ data: { walletId: wallet.id, amount: parsed.data.amount, reference } });

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: session.email,
      amount: parsed.data.amount,
      reference,
      callback_url: `${appUrl.replace(/\/$/, '')}/dashboard/professional/wallet`,
    }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.data?.authorization_url) {
    console.error('[wallet/fund] Paystack initialization failed:', response.status, body?.message ?? 'unknown error');
    await prisma.walletFunding.delete({ where: { reference } });
    return NextResponse.json({ error: 'Unable to initialize wallet funding.' }, { status: 502 });
  }
  return NextResponse.json({ authorizationUrl: body.data.authorization_url, reference });
}

