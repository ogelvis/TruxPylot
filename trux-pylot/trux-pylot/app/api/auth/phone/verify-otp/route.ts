import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkPhoneVerification, issuePhoneTicket, isValidPhone } from '@/lib/twilio-verify';

const input = z.object({
  phone: z.string().refine(isValidPhone, 'Enter a valid phone number with country code, e.g. +2348012345678'),
  code: z.string().min(4).max(10),
});

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 });

  try {
    const result = await checkPhoneVerification(parsed.data.phone, parsed.data.code);
    if (result.status !== 'approved') {
      return NextResponse.json({ approved: false, error: 'Incorrect or expired code' }, { status: 400 });
    }
    const ticket = await issuePhoneTicket(parsed.data.phone);
    return NextResponse.json({ approved: true, ticket });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not check code' }, { status: 502 });
  }
}
