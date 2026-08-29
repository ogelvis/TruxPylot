import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { consumeResetToken } from '@/lib/password-reset';

const input = z.object({ token: z.string().min(10), password: z.string().min(12) });

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Password must be at least 12 characters.' }, { status: 400 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const userId = await consumeResetToken(parsed.data.token, passwordHash);
  if (!userId) return NextResponse.json({ error: 'This reset link is invalid or has expired. Request a new one.' }, { status: 400 });

  return NextResponse.json({ ok: true });
}
