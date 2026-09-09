import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const input = z.object({
  fullName: z.string().min(2).max(120),
  profession: z.string().max(120).optional(),
  bio: z.string().max(2000).optional(),
  location: z.string().max(120).optional(),
  yearsExperience: z.number().int().min(0).max(60).optional(),
  phone: z.string().min(7).max(20).optional(),
});

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSIONAL') {
    return NextResponse.json({ error: 'Professional sign-in required' }, { status: 401 });
  }
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the fields and try again.' }, { status: 400 });
  }
  const { phone, ...profileFields } = parsed.data;

  try {
    await prisma.$transaction([
      prisma.professional.update({ where: { userId: session.userId }, data: profileFields }),
      ...(phone ? [prisma.user.update({ where: { id: session.userId }, data: { phone: phone.trim() } })] : []),
    ]);
  } catch (error) {
    const prismaError = error as { code?: string; meta?: { target?: unknown } };
    if (prismaError.code === 'P2002') {
      const target = Array.isArray(prismaError.meta?.target) ? prismaError.meta?.target.join(', ') : String(prismaError.meta?.target ?? '');
      if (target.includes('phone')) {
        return NextResponse.json({ error: 'This phone number is already associated with another TruxPylot account. Please use a different phone number.' }, { status: 409 });
      }
    }
    console.error('[professional/profile] update failed', error);
    return NextResponse.json({ error: 'Could not update your profile. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
