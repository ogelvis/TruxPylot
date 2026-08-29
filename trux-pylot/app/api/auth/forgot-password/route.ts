import { NextResponse } from 'next/server';
import { z } from 'zod';
import { issuePasswordReset } from '@/lib/password-reset';

const input = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });

  const baseUrl = new URL(request.url).origin;
  await issuePasswordReset(parsed.data.email, baseUrl);

  // Same response whether or not the account exists.
  return NextResponse.json({ ok: true });
}
