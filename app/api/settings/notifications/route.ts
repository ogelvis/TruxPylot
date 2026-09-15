import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const input = z.object({
  jobs: z.boolean().optional(),
  messages: z.boolean().optional(),
  payments: z.boolean().optional(),
  announcements: z.boolean().optional(),
  profileVisibility: z.enum(['PUBLIC','PRIVATE']).optional(),
  communicationAllowed: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
  const preferences = await prisma.notificationPreference.upsert({ where: { userId: session.userId }, create: { userId: session.userId }, update: {} });
  return NextResponse.json({ preferences }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid notification settings.' }, { status: 400 });
  const preferences = await prisma.notificationPreference.upsert({ where: { userId: session.userId }, create: { userId: session.userId, ...parsed.data }, update: parsed.data });
  return NextResponse.json({ preferences });
}
