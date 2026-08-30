import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const input = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(20).optional(),
  country: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  area: z.string().max(120).optional(),
  street: z.string().max(200).optional(),
});

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Customer sign-in required' }, { status: 401 });
  }
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Please check the fields and try again.' }, { status: 400 });
  const { phone, ...profileFields } = parsed.data;

  const location = [profileFields.area, profileFields.city, profileFields.state].filter(Boolean).join(', ') || undefined;

  await prisma.$transaction([
    prisma.customer.update({ where: { userId: session.userId }, data: { ...profileFields, ...(location ? { location } : {}) } }),
    ...(phone ? [prisma.user.update({ where: { id: session.userId }, data: { phone } })] : []),
  ]);

  return NextResponse.json({ ok: true });
}
