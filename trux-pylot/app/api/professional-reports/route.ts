import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const input = z.object({
  professionalId: z.string().cuid(),
  reason: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Sign in with a customer account to submit a report.' }, { status: 401 });
  }
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Please check your details and try again.' }, { status: 400 });

  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer) return NextResponse.json({ error: 'Customer profile missing.' }, { status: 403 });

  const professional = await prisma.professional.findUnique({ where: { id: parsed.data.professionalId } });
  if (!professional) return NextResponse.json({ error: 'Professional not found.' }, { status: 404 });

  await prisma.professionalReport.create({
    data: {
      professionalId: professional.id,
      customerId: customer.id,
      reason: parsed.data.reason,
      description: parsed.data.description,
    },
  });

  return NextResponse.json({ ok: true });
}
