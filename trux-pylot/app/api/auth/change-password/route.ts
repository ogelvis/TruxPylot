import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const input = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign-in required' }, { status: 401 });

  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Please check the fields and try again.' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: session.userId }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
